// app/api/hr/payroll/route.ts
// HR Payroll Management API with Travel Expense Integration

import { NextRequest } from 'next/server';
import { 
  withOrgScope, 
  PERMISSIONS, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/hr/payroll - Get payroll records
export const GET = withOrgScope(
  PERMISSIONS.MANAGE_PAYROLL,
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const payPeriod = searchParams.get('payPeriod'); // Format: "2024-01"
      const userId = searchParams.get('userId');
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const where = {
        organizationId: user.organizationId,
        ...(payPeriod && { payPeriod }),
        ...(userId && { userId }),
        ...(status && { status })
      };

      const [payrollRecords, totalCount] = await Promise.all([
        prisma.payrollRecord.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                email: true,
                department: true,
                designation: true,
                employeeProfile: {
                  select: {
                    salary: true,
                    employmentType: true,
                    bankName: true,
                    accountNumber: true
                  }
                }
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [
            { payPeriod: 'desc' },
            { user: { name: 'asc' } }
          ]
        }),
        prisma.payrollRecord.count({ where })
      ]);

      // Calculate summary statistics
      const summary = {
        totalRecords: totalCount,
        totalGrossPay: payrollRecords.reduce((sum, record) => sum + Number(record.grossPay), 0),
        totalNetPay: payrollRecords.reduce((sum, record) => sum + Number(record.netPay), 0),
        totalTravelReimbursement: payrollRecords.reduce((sum, record) => sum + Number(record.travelReimbursement), 0),
        statusBreakdown: {
          draft: payrollRecords.filter(r => r.status === 'DRAFT').length,
          processed: payrollRecords.filter(r => r.status === 'PROCESSED').length,
          paid: payrollRecords.filter(r => r.status === 'PAID').length
        }
      };

      await logApiAction(user.id, 'VIEW', 'payroll', undefined, { 
        payPeriod, 
        count: payrollRecords.length 
      });

      return successResponse({
        payrollRecords,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching payroll:', error);
      return errorResponse('Failed to fetch payroll records');
    }
  }
);

// POST /api/hr/payroll - Generate payroll for a pay period
export const POST = withOrgScope(
  PERMISSIONS.MANAGE_PAYROLL,
  async (request, user) => {
    try {
      const { payPeriod, userIds } = await request.json();

      if (!payPeriod) {
        return errorResponse('Pay period is required');
      }

      // Get employees to process
      const employees = await prisma.user.findMany({
        where: {
          organizationId: user.organizationId,
          isActive: true,
          ...(userIds && userIds.length > 0 && { id: { in: userIds } })
        },
        include: {
          employeeProfile: true,
          travelRequests: {
            where: {
              status: 'approved',
              expensesSubmittedAt: {
                gte: new Date(`${payPeriod}-01`),
                lt: new Date(new Date(`${payPeriod}-01`).getTime() + 32 * 24 * 60 * 60 * 1000) // Next month
              }
            },
            select: {
              totalAmount: true,
              expenseItems: {
                select: { amount: true }
              }
            }
          }
        }
      });

      const payrollRecords = await prisma.$transaction(async (tx) => {
        const records = [];
        
        for (const employee of employees) {
          // Check if payroll record already exists
          const existingRecord = await tx.payrollRecord.findUnique({
            where: {
              userId_payPeriod: {
                userId: employee.id,
                payPeriod
              }
            }
          });

          if (existingRecord) {
            continue; // Skip if already exists
          }

          // Calculate travel reimbursements
          const travelReimbursement = employee.travelRequests.reduce((sum, request) => {
            const expenseTotal = request.expenseItems?.reduce((expSum, item) => 
              expSum + Number(item.amount), 0) || 0;
            return sum + expenseTotal;
          }, 0);

          // Get basic salary from profile
          const basicSalary = employee.employeeProfile?.salary || 0;
          
          // Basic calculation (can be enhanced with complex rules)
          const allowances = Number(basicSalary) * 0.4; // 40% of basic
          const deductions = Number(basicSalary) * 0.12; // 12% for taxes/PF
          const grossPay = Number(basicSalary) + allowances + travelReimbursement;
          const netPay = grossPay - deductions;

          const record = await tx.payrollRecord.create({
            data: {
              userId: employee.id,
              organizationId: user.organizationId,
              payPeriod,
              basicSalary,
              allowances,
              deductions,
              travelReimbursement,
              overtimePay: 0, // Can be calculated from time logs
              bonus: 0,
              grossPay,
              netPay,
              status: 'DRAFT'
            }
          });

          records.push(record);
        }

        return records;
      });

      await logApiAction(user.id, 'GENERATE', 'payroll', undefined, { 
        payPeriod, 
        generatedRecords: payrollRecords.length 
      });

      return successResponse({
        message: `Generated ${payrollRecords.length} payroll records for ${payPeriod}`,
        records: payrollRecords
      }, 201);

    } catch (error) {
      console.error('Error generating payroll:', error);
      return errorResponse('Failed to generate payroll');
    }
  }
);

// PUT /api/hr/payroll - Update payroll status (bulk operation)
export const PUT = withOrgScope(
  PERMISSIONS.MANAGE_PAYROLL,
  async (request, user) => {
    try {
      const { recordIds, status, processedDate } = await request.json();

      if (!recordIds || !Array.isArray(recordIds) || !status) {
        return errorResponse('recordIds (array) and status are required');
      }

      const validStatuses = ['DRAFT', 'PROCESSED', 'PAID', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return errorResponse('Invalid status');
      }

      const updatedRecords = await prisma.payrollRecord.updateMany({
        where: {
          id: { in: recordIds },
          organizationId: user.organizationId
        },
        data: {
          status,
          ...(processedDate && { processedDate: new Date(processedDate) })
        }
      });

      await logApiAction(user.id, 'UPDATE_STATUS', 'payroll', undefined, { 
        recordIds, 
        newStatus: status,
        count: updatedRecords.count 
      });

      return successResponse({
        message: `Updated ${updatedRecords.count} payroll records to ${status}`,
        updatedCount: updatedRecords.count
      });

    } catch (error) {
      console.error('Error updating payroll status:', error);
      return errorResponse('Failed to update payroll status');
    }
  }
);