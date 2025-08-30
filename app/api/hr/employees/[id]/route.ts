// app/api/hr/employees/[id]/route.ts
// Individual Employee Management API

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  PERMISSIONS, 
  successResponse, 
  errorResponse,
  canAccessUserData,
  logApiAction
} from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

// GET /api/hr/employees/[id] - Get specific employee
export const GET = withAuth(
  async (request, user, { params }: RouteParams) => {
    try {
      const employeeId = params.id;
      
      // Check access permissions
      if (!(await canAccessUserData(user, employeeId))) {
        return errorResponse('Access denied', 403);
      }

      const employee = await prisma.user.findUnique({
        where: { 
          id: employeeId,
          organizationId: user.organizationId 
        },
        include: {
          employeeProfile: true,
          manager: {
            select: { id: true, name: true, employeeId: true, email: true }
          },
          subordinates: {
            select: { id: true, name: true, employeeId: true, department: true },
            where: { isActive: true }
          },
          travelRequests: {
            select: {
              id: true,
              requestType: true,
              status: true,
              totalAmount: true,
              purpose: true,
              createdAt: true,
              travelDateFrom: true,
              travelDateTo: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          valleyRequests: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              purpose: true,
              createdAt: true,
              expenseDate: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          leaveRequests: {
            select: {
              id: true,
              leaveType: true,
              status: true,
              reason: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          timeLogs: {
            select: {
              id: true,
              date: true,
              hoursSpent: true,
              taskType: true,
              description: true
            },
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      });

      if (!employee) {
        return errorResponse('Employee not found', 404);
      }

      // Calculate employee metrics
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      const metrics = {
        totalTravelRequests: employee.travelRequests.length,
        pendingRequests: employee.travelRequests.filter(r => r.status === 'pending').length,
        approvedRequests: employee.travelRequests.filter(r => r.status === 'approved').length,
        totalSpentThisYear: employee.travelRequests
          .filter(r => r.status === 'approved' && new Date(r.createdAt).getFullYear() === currentYear)
          .reduce((sum, r) => sum + Number(r.totalAmount), 0),
        totalHoursThisMonth: employee.timeLogs
          .filter(log => new Date(log.date).getMonth() === currentMonth)
          .reduce((sum, log) => sum + Number(log.hoursSpent), 0),
        teamSize: employee.subordinates.length,
        lastActivity: employee.travelRequests[0]?.createdAt || employee.updatedAt
      };

      await logApiAction(user.id, 'VIEW', 'employee', employeeId);

      return successResponse({
        ...employee,
        metrics
      });

    } catch (error) {
      console.error('Error fetching employee:', error);
      return errorResponse('Failed to fetch employee');
    }
  }
);

// PUT /api/hr/employees/[id] - Update employee
export const PUT = withAuth(
  async (request, user, { params }: RouteParams) => {
    try {
      const employeeId = params.id;
      const data = await request.json();

      // Check if user can update this employee
      const canUpdate = user.id === employeeId || 
                       user.role === 'HR_ADMIN' || 
                       user.role === 'ADMIN' || 
                       user.role === 'SUPER_ADMIN';

      if (!canUpdate) {
        return errorResponse('Access denied', 403);
      }

      const updatedEmployee = await prisma.$transaction(async (tx) => {
        // Update user
        const user = await tx.user.update({
          where: { 
            id: employeeId,
            organizationId: user.organizationId 
          },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.employeeId && { employeeId: data.employeeId }),
            ...(data.department && { department: data.department }),
            ...(data.designation && { designation: data.designation }),
            ...(data.managerId !== undefined && { managerId: data.managerId }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.joinDate && { joinDate: new Date(data.joinDate) }),
            ...(data.terminationDate && { terminationDate: new Date(data.terminationDate) })
          }
        });

        // Update employee profile if provided
        if (data.profile) {
          await tx.employeeProfile.upsert({
            where: { userId: employeeId },
            create: {
              userId: employeeId,
              organizationId: user.organizationId,
              ...data.profile
            },
            update: data.profile
          });
        }

        return user;
      });

      await logApiAction(user.id, 'UPDATE', 'employee', employeeId, { 
        updatedFields: Object.keys(data) 
      });

      return successResponse(updatedEmployee);

    } catch (error) {
      console.error('Error updating employee:', error);
      return errorResponse('Failed to update employee');
    }
  }
);

// DELETE /api/hr/employees/[id] - Deactivate employee
export const DELETE = withAuth(
  async (request, user, { params }: RouteParams) => {
    try {
      const employeeId = params.id;

      // Only HR_ADMIN and above can deactivate employees
      if (!['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Insufficient permissions', 403);
      }

      // Soft delete - deactivate instead of hard delete
      const deactivatedEmployee = await prisma.user.update({
        where: { 
          id: employeeId,
          organizationId: user.organizationId 
        },
        data: {
          isActive: false,
          terminationDate: new Date()
        }
      });

      await logApiAction(user.id, 'DEACTIVATE', 'employee', employeeId);

      return successResponse({
        message: 'Employee deactivated successfully',
        employee: deactivatedEmployee
      });

    } catch (error) {
      console.error('Error deactivating employee:', error);
      return errorResponse('Failed to deactivate employee');
    }
  }
);