// app/api/leave-requests/route.ts
// Enhanced Leave Requests API with Role-Based Access

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/leave-requests - Get leave requests with filtering
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const employeeId = searchParams.get('employeeId');
      const approverId = searchParams.get('approverId');
      const status = searchParams.get('status');
      const leaveType = searchParams.get('leaveType');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const myRequests = searchParams.get('myRequests') === 'true';

      let where: any = {
        organizationId: user.organizationId
      };

      // Role-based filtering
      if (user.role === 'EMPLOYEE' || myRequests) {
        where.employeeId = user.id;
      } else if (user.role === 'MANAGER') {
        // Managers can see their team's leave requests
        const teamMembers = await dbHandler.prisma.user.findMany({
          where: { managerId: user.id, organizationId: user.organizationId },
          select: { id: true }
        });
        const teamIds = teamMembers.map(m => m.id);
        where.OR = [
          { employeeId: user.id },
          { employeeId: { in: teamIds } },
          { approverId: user.id }
        ];
      } else if (['APPROVER', 'CHECKER', 'FINANCE'].includes(user.role)) {
        where.approverId = user.id;
      }
      // HR_ADMIN, ADMIN, SUPER_ADMIN can see all requests (no additional filter)

      // Apply filters
      if (employeeId) where.employeeId = employeeId;
      if (approverId) where.approverId = approverId;
      if (status) where.status = status;
      if (leaveType) where.leaveType = leaveType;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [leaveRequests, totalCount] = await Promise.all([
        dbHandler.prisma.leaveRequest.findMany({
          where,
          include: {
            employee: {
              select: { id: true, name: true, employeeId: true, department: true }
            },
            approver: {
              select: { id: true, name: true, employeeId: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        dbHandler.prisma.leaveRequest.count({ where })
      ]);

      // Calculate summary statistics
      const summary = {
        total: totalCount,
        pending: leaveRequests.filter(r => r.status === 'pending').length,
        approved: leaveRequests.filter(r => r.status === 'approved').length,
        rejected: leaveRequests.filter(r => r.status === 'rejected').length,
        byType: leaveRequests.reduce((acc, r) => {
          acc[r.leaveType] = (acc[r.leaveType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        advanced: leaveRequests.filter(r => r.isAdvanced).length
      };

      await logApiAction(user.id, 'VIEW', 'leave_requests', undefined, { 
        count: leaveRequests.length,
        filters: { employeeId, approverId, status }
      });

      return successResponse({
        leaveRequests,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching leave requests:', error);
      return errorResponse('Failed to fetch leave requests');
    }
  }
);

// POST /api/leave-requests - Create new leave request
export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      if (!body.leaveType || !body.reason) {
        return errorResponse('Leave type and reason are required', 400);
      }

      // Auto-assign approver if not provided
      let approverId = body.approverId;
      let approverName = body.approverName;

      if (!approverId) {
        const approver = await dbHandler.prisma.user.findFirst({
          where: {
            organizationId: user.organizationId,
            role: { in: ['APPROVER', 'HR_ADMIN', 'ADMIN'] },
            isActive: true
          },
          orderBy: { role: 'desc' }
        });

        if (approver) {
          approverId = approver.id;
          approverName = approver.name;
        }
      }

      const leaveRequest = await dbHandler.prisma.$transaction(async (tx) => {
        const request = await tx.leaveRequest.create({
          data: {
            employeeId: user.id,
            employeeName: user.name,
            leaveType: body.leaveType,
            reason: body.reason,
            approverId: approverId || null,
            approverName: approverName || null,
            status: 'pending',
            isAdvanced: body.isAdvanced || false,
            organizationId: user.organizationId
          },
          include: {
            employee: {
              select: { id: true, name: true, employeeId: true }
            },
            approver: {
              select: { id: true, name: true, employeeId: true }
            }
          }
        });

        // Create notification for approver
        if (approverId) {
          await tx.notification.create({
            data: {
              userId: approverId,
              organizationId: user.organizationId,
              message: `New leave request from ${user.name} requires approval: ${body.leaveType}`,
              requestType: 'leave_request',
              requestId: request.id
            }
          });
        }

        return request;
      });

      await logApiAction(user.id, 'CREATE', 'leave_request', leaveRequest.id, {
        leaveType: body.leaveType,
        isAdvanced: body.isAdvanced
      });

      return successResponse(leaveRequest, 201);

    } catch (error) {
      console.error('Error creating leave request:', error);
      return errorResponse('Failed to create leave request');
    }
  }
);

// PUT /api/leave-requests - Update leave request status
export const PUT = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { id, status, approverComments } = body;

      if (!id || !status) {
        return errorResponse('Request ID and status are required', 400);
      }

      // Verify request exists and user has permission to update
      const existingRequest = await dbHandler.prisma.leaveRequest.findFirst({
        where: {
          id,
          organizationId: user.organizationId
        }
      });

      if (!existingRequest) {
        return errorResponse('Leave request not found', 404);
      }

      // Check permissions
      const canUpdate = existingRequest.approverId === user.id || 
                       ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);

      if (!canUpdate) {
        return errorResponse('Access denied - Insufficient permissions', 403);
      }

      const updatedRequest = await dbHandler.prisma.$transaction(async (tx) => {
        const request = await tx.leaveRequest.update({
          where: { id },
          data: {
            status,
            approverComments: approverComments || null,
            approvedAt: status === 'approved' ? new Date() : null,
            rejectedAt: status === 'rejected' ? new Date() : null
          },
          include: {
            employee: {
              select: { id: true, name: true, employeeId: true }
            },
            approver: {
              select: { id: true, name: true, employeeId: true }
            }
          }
        });

        // Create notification for employee
        await tx.notification.create({
          data: {
            userId: existingRequest.employeeId,
            organizationId: user.organizationId,
            message: `Your leave request has been ${status}: ${existingRequest.leaveType}`,
            requestType: 'leave_request',
            requestId: id
          }
        });

        return request;
      });

      await logApiAction(user.id, 'UPDATE', 'leave_request', id, {
        status,
        hasComments: !!approverComments
      });

      return successResponse(updatedRequest);

    } catch (error) {
      console.error('Error updating leave request:', error);
      return errorResponse('Failed to update leave request');
    }
  }
);