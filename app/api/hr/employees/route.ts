// app/api/hr/employees/route.ts
// HR Employee Management API - Comprehensive CRUD with Role-Based Access

import { NextRequest } from 'next/server';
import { 
  withOrgScope, 
  PERMISSIONS, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/hr/employees - Get all employees with HR details
export const GET = withOrgScope(
  PERMISSIONS.VIEW_TEAM_DATA,
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const department = searchParams.get('department') || '';
      const status = searchParams.get('status') || 'active';
      const includeProfiles = searchParams.get('includeProfiles') === 'true';

      const where = {
        organizationId: user.organizationId,
        ...(status === 'active' ? { isActive: true } : {}),
        ...(status === 'inactive' ? { isActive: false } : {}),
        ...(department && { department }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { employeeId: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [employees, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            employeeProfile: includeProfiles,
            manager: {
              select: { id: true, name: true, employeeId: true }
            },
            subordinates: {
              select: { id: true, name: true },
              where: { isActive: true }
            },
            travelRequests: {
              select: { 
                id: true, 
                status: true, 
                totalAmount: true,
                createdAt: true 
              },
              where: { 
                createdAt: { 
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
                } 
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { name: 'asc' }
        }),
        prisma.user.count({ where })
      ]);

      // Calculate HR metrics for each employee
      const employeesWithMetrics = employees.map(employee => {
        const thisMonthRequests = employee.travelRequests || [];
        return {
          id: employee.id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          department: employee.department,
          designation: employee.designation,
          isActive: employee.isActive,
          joinDate: employee.joinDate,
          terminationDate: employee.terminationDate,
          manager: employee.manager,
          teamSize: employee.subordinates?.length || 0,
          ...(includeProfiles && { profile: employee.employeeProfile }),
          metrics: {
            requestsThisMonth: thisMonthRequests.length,
            pendingRequests: thisMonthRequests.filter(r => r.status === 'pending').length,
            totalSpentThisMonth: thisMonthRequests
              .filter(r => r.status === 'approved')
              .reduce((sum, r) => sum + Number(r.totalAmount), 0)
          },
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt
        };
      });

      await logApiAction(user.id, 'VIEW', 'employees', undefined, { 
        count: employees.length, 
        filters: { department, status, search } 
      });

      return successResponse({
        employees: employeesWithMetrics,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching employees:', error);
      return errorResponse('Failed to fetch employees');
    }
  }
);

// POST /api/hr/employees - Create new employee
export const POST = withOrgScope(
  PERMISSIONS.MANAGE_EMPLOYEES,
  async (request, user) => {
    try {
      const data = await request.json();
      
      // Validate required fields
      if (!data.name || !data.email) {
        return errorResponse('Name and email are required');
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return errorResponse('Email already exists');
      }

      // Create employee with profile
      const employee = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            employeeId: data.employeeId,
            role: data.role || 'EMPLOYEE',
            department: data.department,
            designation: data.designation,
            managerId: data.managerId,
            organizationId: user.organizationId,
            joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
            password: data.password || 'temp123' // Should be hashed in production
          }
        });

        // Create employee profile if profile data provided
        if (data.profile) {
          await tx.employeeProfile.create({
            data: {
              userId: newUser.id,
              organizationId: user.organizationId,
              personalEmail: data.profile.personalEmail,
              phone: data.profile.phone,
              emergencyContact: data.profile.emergencyContact,
              emergencyPhone: data.profile.emergencyPhone,
              address: data.profile.address,
              dateOfBirth: data.profile.dateOfBirth ? new Date(data.profile.dateOfBirth) : null,
              nationality: data.profile.nationality,
              maritalStatus: data.profile.maritalStatus,
              employmentType: data.profile.employmentType || 'FULL_TIME',
              salary: data.profile.salary,
              salaryGrade: data.profile.salaryGrade,
              probationEndDate: data.profile.probationEndDate ? new Date(data.profile.probationEndDate) : null,
              bankName: data.profile.bankName,
              accountNumber: data.profile.accountNumber,
              ifscCode: data.profile.ifscCode
            }
          });
        }

        return newUser;
      });

      await logApiAction(user.id, 'CREATE', 'employee', employee.id, { 
        employeeData: { name: data.name, email: data.email, department: data.department } 
      });

      return successResponse(employee, 201);

    } catch (error) {
      console.error('Error creating employee:', error);
      return errorResponse('Failed to create employee');
    }
  }
);

// PUT /api/hr/employees - Bulk update employees
export const PUT = withOrgScope(
  PERMISSIONS.MANAGE_EMPLOYEES,
  async (request, user) => {
    try {
      const { employees } = await request.json();
      
      if (!Array.isArray(employees)) {
        return errorResponse('employees must be an array');
      }

      const updatedEmployees = await prisma.$transaction(async (tx) => {
        const results = [];
        for (const emp of employees) {
          const updated = await tx.user.update({
            where: { 
              id: emp.id,
              organizationId: user.organizationId 
            },
            data: {
              name: emp.name,
              department: emp.department,
              designation: emp.designation,
              managerId: emp.managerId,
              isActive: emp.isActive,
              ...(emp.terminationDate && { terminationDate: new Date(emp.terminationDate) })
            }
          });
          results.push(updated);
        }
        return results;
      });

      await logApiAction(user.id, 'BULK_UPDATE', 'employees', undefined, { 
        count: updatedEmployees.length 
      });

      return successResponse({ 
        updated: updatedEmployees.length,
        employees: updatedEmployees 
      });

    } catch (error) {
      console.error('Error bulk updating employees:', error);
      return errorResponse('Failed to update employees');
    }
  }
);