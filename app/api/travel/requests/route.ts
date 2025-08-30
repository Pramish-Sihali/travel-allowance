// app/api/travel/requests/route.ts
// Enhanced Travel Request API with Role-Based Access and Prisma Integration

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

// GET /api/travel/requests - Get travel requests with role-based filtering
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const employeeId = searchParams.get('employeeId');
      const status = searchParams.get('status');
      const requestType = searchParams.get('requestType');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const search = searchParams.get('search');
      const department = searchParams.get('department');
      const approverView = searchParams.get('approverView') === 'true';

      // Build where clause based on user role and permissions
      let where: any = {
        organizationId: user.organizationId
      };

      // Role-based filtering
      if (user.role === 'EMPLOYEE' && !employeeId) {
        // Employees can only see their own requests
        where.employeeId = user.id;
      } else if (user.role === 'MANAGER') {
        // Managers can see their team's requests + their own
        if (!employeeId) {
          const teamMembers = await prisma.user.findMany({
            where: {
              managerId: user.id,
              organizationId: user.organizationId
            },
            select: { id: true }
          });
          const teamIds = teamMembers.map(member => member.id);
          where.employeeId = { in: [...teamIds, user.id] };
        } else if (!(await canAccessUserData(user, employeeId))) {
          return errorResponse('Access denied', 403);
        }
      } else if (['APPROVER', 'CHECKER', 'FINANCE'].includes(user.role)) {
        // These roles can see requests assigned to them or all pending
        if (approverView) {
          where.OR = [
            { approverId: user.id },
            { status: 'pending' },
            { status: 'travel_approved', phase: user.role === 'FINANCE' ? 2 : 1 }
          ];
        }
      }
      // HR_ADMIN, ADMIN, SUPER_ADMIN can see all requests (no additional filtering)

      // Apply additional filters
      if (employeeId) {
        where.employeeId = employeeId;
      }
      if (status) {
        where.status = status;
      }
      if (requestType) {
        where.requestType = requestType;
      }
      if (department) {
        where.department = department;
      }
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }
      if (search) {
        where.OR = [
          { employeeName: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { project: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [requests, totalCount] = await Promise.all([
        prisma.travelRequest.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                email: true,
                department: true,
                designation: true
              }
            },
            approver: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                email: true
              }
            },
            expenseItems: {
              select: {
                id: true,
                category: true,
                amount: true,
                description: true,
                status: true
              }
            },
            notifications: {
              where: { userId: user.id },
              select: {
                id: true,
                message: true,
                isRead: true,
                createdAt: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.travelRequest.count({ where })
      ]);

      // Transform data for API response
      const transformedRequests = requests.map(request => ({
        id: request.id,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        employee: request.employee,
        department: request.department,
        designation: request.designation,
        requestType: request.requestType,
        project: request.project,
        projectOther: request.projectOther,
        purpose: request.purpose,
        purposeType: request.purposeType,
        purposeOther: request.purposeOther,
        location: request.location,
        locationOther: request.locationOther,
        travelDateFrom: request.travelDateFrom,
        travelDateTo: request.travelDateTo,
        transportMode: request.transportMode,
        stationPickDrop: request.stationPickDrop,
        localConveyance: request.localConveyance,
        rideShareUsed: request.rideShareUsed,
        ownVehicleReimbursement: request.ownVehicleReimbursement,
        totalAmount: Number(request.totalAmount),
        previousOutstandingAdvance: Number(request.previousOutstandingAdvance || 0),
        isGroupTravel: request.isGroupTravel,
        isGroupCaptain: request.isGroupCaptain,
        groupSize: request.groupSize,
        groupMembers: request.groupMembers?.split(',') || null,
        groupDescription: request.groupDescription,
        estimatedAmount: request.estimatedAmount,
        advanceNotes: request.advanceNotes,
        emergencyReason: request.emergencyReason,
        emergencyReasonOther: request.emergencyReasonOther,
        emergencyJustification: request.emergencyJustification,
        emergencyAmount: request.emergencyAmount,
        needsFinancialAttention: request.needsFinancialAttention,
        isUrgent: request.isUrgent,
        status: request.status,
        phase: request.phase,
        approverId: request.approverId,
        approver: request.approver,
        approverComments: request.approverComments,
        checkerComments: request.checkerComments,
        financeComments: request.financeComments,
        expenseDate: request.expenseDate,
        description: request.description,
        paymentMethod: request.paymentMethod,
        meetingType: request.meetingType,
        meetingParticipants: request.meetingParticipants,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        travelDetailsApprovedAt: request.travelDetailsApprovedAt,
        expensesSubmittedAt: request.expensesSubmittedAt,
        expenseItems: request.expenseItems,
        notifications: request.notifications,
        // Calculated fields
        expenseItemsCount: request.expenseItems.length,
        totalExpenseAmount: request.expenseItems.reduce((sum, item) => sum + Number(item.amount), 0),
        hasUnreadNotifications: request.notifications.some(n => !n.isRead)
      }));

      // Calculate summary statistics
      const summary = {
        total: totalCount,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => ['rejected', 'rejected_by_checker'].includes(r.status)).length,
        totalAmount: transformedRequests.reduce((sum, r) => sum + r.totalAmount, 0),
        byRequestType: {
          normal: requests.filter(r => r.requestType === 'NORMAL').length,
          advance: requests.filter(r => r.requestType === 'ADVANCE').length,
          emergency: requests.filter(r => r.requestType === 'EMERGENCY').length,
          group: requests.filter(r => r.requestType === 'GROUP').length
        }
      };

      await logApiAction(user.id, 'VIEW', 'travel_requests', undefined, { 
        count: requests.length,
        filters: { status, requestType, department, employeeId } 
      });

      return successResponse({
        requests: transformedRequests,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching travel requests:', error);
      return errorResponse('Failed to fetch travel requests');
    }
  }
);

// POST /api/travel/requests - Create new travel request
export const POST = withAuth(
  async (request, user) => {
    try {
      const data = await request.json();

      // Validate required fields
      const requiredFields = ['purpose', 'location', 'travelDateFrom', 'travelDateTo', 'totalAmount'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return errorResponse(`${field} is required`);
        }
      }

      // Get employee details if not provided
      const employee = await prisma.user.findUnique({
        where: { id: data.employeeId || user.id },
        select: {
          id: true,
          name: true,
          employeeId: true,
          department: true,
          designation: true,
          organizationId: true
        }
      });

      if (!employee) {
        return errorResponse('Employee not found');
      }

      // Get project name if UUID provided
      let projectName = data.project;
      if (data.project && data.project.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const project = await prisma.project.findUnique({
          where: { id: data.project },
          select: { name: true }
        });
        projectName = project?.name || data.project;
      } else if (data.project === 'other' && data.projectOther) {
        projectName = data.projectOther;
      }

      // Create travel request
      const newRequest = await prisma.$transaction(async (tx) => {
        const travelRequest = await tx.travelRequest.create({
          data: {
            employeeId: employee.id,
            employeeName: employee.name,
            department: employee.department || '',
            designation: employee.designation || '',
            organizationId: employee.organizationId,
            requestType: data.requestType || 'NORMAL',
            project: projectName,
            projectOther: data.projectOther,
            purpose: data.purpose,
            purposeType: data.purposeType,
            purposeOther: data.purposeOther,
            location: data.location,
            locationOther: data.locationOther,
            travelDateFrom: data.travelDateFrom,
            travelDateTo: data.travelDateTo,
            transportMode: data.transportMode || '',
            stationPickDrop: data.stationPickDrop || '',
            localConveyance: data.localConveyance || '',
            rideShareUsed: data.rideShareUsed || false,
            ownVehicleReimbursement: data.ownVehicleReimbursement || false,
            totalAmount: data.totalAmount,
            previousOutstandingAdvance: data.previousOutstandingAdvance || 0,
            isGroupTravel: data.isGroupTravel || false,
            isGroupCaptain: data.isGroupCaptain || false,
            groupSize: data.groupSize,
            groupMembers: Array.isArray(data.groupMembers) ? data.groupMembers.join(',') : data.groupMembers,
            groupDescription: data.groupDescription,
            estimatedAmount: data.estimatedAmount,
            advanceNotes: data.advanceNotes,
            emergencyReason: data.emergencyReason,
            emergencyReasonOther: data.emergencyReasonOther,
            emergencyJustification: data.emergencyJustification,
            emergencyAmount: data.emergencyAmount,
            needsFinancialAttention: data.needsFinancialAttention || false,
            isUrgent: data.isUrgent || false,
            status: 'pending',
            phase: 1,
            approverId: data.approverId,
            expenseDate: data.expenseDate,
            description: data.description,
            paymentMethod: data.paymentMethod,
            meetingType: data.meetingType,
            meetingParticipants: data.meetingParticipants
          }
        });

        // Create notifications
        await tx.notification.createMany({
          data: [
            {
              userId: employee.id,
              organizationId: employee.organizationId,
              requestId: travelRequest.id,
              message: `Your ${data.requestType || 'travel'} request has been submitted and is awaiting approval.`,
              requestType: 'travel'
            },
            {
              userId: data.approverId,
              organizationId: employee.organizationId,
              requestId: travelRequest.id,
              message: `A new ${data.requestType || 'travel'} request from ${employee.name} is waiting for your approval.`,
              requestType: 'travel'
            }
          ]
        });

        return travelRequest;
      });

      await logApiAction(user.id, 'CREATE', 'travel_request', newRequest.id, { 
        requestType: data.requestType,
        amount: data.totalAmount 
      });

      return successResponse(newRequest, 201);

    } catch (error) {
      console.error('Error creating travel request:', error);
      return errorResponse('Failed to create travel request');
    }
  }
);