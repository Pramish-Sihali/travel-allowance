import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';
import { v4 as uuidv4 } from 'uuid';

// GET /api/requests - Get travel requests with role-based filtering
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const employeeId = searchParams.get('employeeId');
      const status = searchParams.get('status');
      const requestType = searchParams.get('requestType');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search');
      const department = searchParams.get('department');
      const myTeam = searchParams.get('myTeam') === 'true';

      let where: any = {
        organizationId: user.organizationId
      };

      // Role-based access control
      if (user.role === 'EMPLOYEE') {
        where.employeeId = user.id;
      } else if (['MANAGER', 'APPROVER'].includes(user.role) && myTeam) {
        // Managers can see their team's requests
        const teamMembers = await dbHandler.prisma.user.findMany({
          where: { managerId: user.id, organizationId: user.organizationId },
          select: { id: true }
        });
        where.employeeId = { in: teamMembers.map(m => m.id) };
      } else if (['APPROVER', 'CHECKER', 'FINANCE'].includes(user.role)) {
        where.approverId = user.id;
      }
      // HR_ADMIN, ADMIN, SUPER_ADMIN can see all requests (no additional filter)

      // Apply filters
      if (employeeId) where.employeeId = employeeId;
      if (status) where.status = status;
      if (requestType) where.requestType = requestType;
      if (department) where.department = department;
      if (dateFrom || dateTo) {
        where.departureDate = {};
        if (dateFrom) where.departureDate.gte = dateFrom;
        if (dateTo) where.departureDate.lte = dateTo;
      }
      if (search) {
        where.OR = [
          { employeeName: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } },
          { destination: { contains: search, mode: 'insensitive' } },
          { project: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [requests, totalCount] = await Promise.all([
        dbHandler.prisma.travelRequest.findMany({
          where,
          include: {
            employee: {
              select: { id: true, name: true, employeeId: true, department: true }
            },
            approver: {
              select: { id: true, name: true, employeeId: true }
            },
            checker: {
              select: { id: true, name: true, employeeId: true }
            },
            receipts: {
              select: { id: true, amount: true, category: true, fileName: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        dbHandler.prisma.travelRequest.count({ where })
      ]);

      // Calculate summary statistics
      const summary = {
        total: totalCount,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status.includes('rejected')).length,
        completed: requests.filter(r => r.status === 'completed').length,
        totalAmount: requests.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0),
        approvedAmount: requests
          .filter(r => r.status === 'approved')
          .reduce((sum, r) => sum + Number(r.totalAmount || 0), 0)
      };

      await logApiAction(user.id, 'VIEW', 'travel_requests', undefined, { 
        count: requests.length,
        filters: { employeeId, status, requestType }
      });

      return successResponse({
        requests,
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

// POST /api/requests - Create new travel request
export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      if (!body.purpose || !body.destination || !body.departureDate) {
        return errorResponse('Purpose, destination, and departure date are required', 400);
      }

      // Extract project information - if it's a UUID, get the project name
      let projectName = body.project;
      
      // Only attempt to fetch project name if it looks like a UUID
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(body.project)) {
        try {
          const projectData = await dbHandler.prisma.project.findUnique({
            where: { id: body.project },
            select: { name: true }
          });
          
          if (projectData) {
            projectName = projectData.name;
          }
        } catch (error) {
          console.error('Error fetching project details:', error);
        }
      } else if (body.project === 'other' && body.projectOther) {
        projectName = body.projectOther;
      }

      // Auto-assign approver based on department/role
      let approverId = body.approverId;
      if (!approverId) {
        const approver = await dbHandler.prisma.user.findFirst({
          where: {
            organizationId: user.organizationId,
            department: user.department,
            role: { in: ['APPROVER', 'HR_ADMIN', 'ADMIN'] },
            isActive: true
          },
          orderBy: { role: 'desc' }
        });
        approverId = approver?.id;
      }
      
      const requestData = {
        employeeId: body.employeeId || user.id,
        employeeName: body.employeeName || user.name,
        employeeIdNumber: body.employeeIdNumber || user.employeeId,
        organizationId: user.organizationId,
        requestType: body.requestType,
        purpose: body.purpose,
        destination: body.destination,
        departureDate: body.departureDate,
        returnDate: body.returnDate,
        durationDays: body.durationDays,
        
        // Financial details
        estimatedAmount: Number(body.estimatedAmount || 0),
        totalAmount: Number(body.totalAmount || body.estimatedAmount || 0),
        
        // Travel details
        transportMode: body.transportMode,
        accommodationType: body.accommodationType,
        mealType: body.mealType,
        project: projectName,
        department: body.department || user.department,
        
        // Emergency and advance details
        isUrgent: body.isUrgent || false,
        urgentReason: body.urgentReason,
        emergencyReason: body.emergencyReason,
        emergencyReasonOther: body.emergencyReasonOther,
        emergencyJustification: body.emergencyJustification,
        emergencyAmount: body.emergencyAmount ? Number(body.emergencyAmount) : null,
        advanceAmount: body.advanceAmount ? Number(body.advanceAmount) : null,
        advanceNotes: body.advanceNotes,
        
        // Group travel details
        isGroupTravel: body.isGroupTravel || false,
        isGroupCaptain: body.isGroupCaptain || false,
        groupSize: body.groupSize ? parseInt(body.groupSize) : null,
        groupDescription: body.groupDescription,
        groupMembers: body.groupMembers,
        
        // Approval workflow
        approverId,
        status: 'pending',
        submittedAt: new Date()
      };

      const newRequest = await dbHandler.prisma.$transaction(async (tx) => {
        const request = await tx.travelRequest.create({
          data: requestData,
          include: {
            employee: {
              select: { id: true, name: true, employeeId: true }
            },
            approver: {
              select: { id: true, name: true }
            }
          }
        });

        // Create notification for approver
        if (approverId) {
          await tx.notification.create({
            data: {
              userId: approverId,
              organizationId: user.organizationId,
              message: `New travel request from ${user.name} requires approval: ${body.purpose}`,
              requestType: 'travel_request',
              requestId: request.id
            }
          });
        }

        return request;
      });

      await logApiAction(user.id, 'CREATE', 'travel_request', newRequest.id, {
        purpose: body.purpose,
        amount: requestData.totalAmount
      });

      return successResponse(newRequest, 201);

    } catch (error) {
      console.error('Error creating travel request:', error);
      return errorResponse('Failed to create travel request');
    }
  }
);