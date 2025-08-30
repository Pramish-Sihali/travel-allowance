// app/api/meetings/enhanced/route.ts
// Enhanced Meeting Management API with Action Items and Follow-ups

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  PERMISSIONS, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/meetings/enhanced - Get meetings with comprehensive data
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status');
      const meetingType = searchParams.get('meetingType');
      const assignedTo = searchParams.get('assignedTo');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const includeActionItems = searchParams.get('includeActionItems') === 'true';
      const myMeetings = searchParams.get('myMeetings') === 'true';

      let where: any = {
        organizationId: user.organizationId
      };

      // Role-based filtering
      if (user.role === 'EMPLOYEE' || myMeetings) {
        where.OR = [
          { createdBy: user.id },
          { assignedTo: user.id }
        ];
      }

      // Apply filters
      if (status) where.status = status;
      if (meetingType) where.meetingType = meetingType;
      if (assignedTo) where.assignedTo = assignedTo;
      if (dateFrom || dateTo) {
        where.meetingDate = {};
        if (dateFrom) where.meetingDate.gte = dateFrom;
        if (dateTo) where.meetingDate.lte = dateTo;
      }

      const [meetings, totalCount] = await Promise.all([
        prisma.meeting.findMany({
          where,
          include: {
            creator: {
              select: { id: true, name: true, employeeId: true }
            },
            assignee: {
              select: { id: true, name: true, employeeId: true }
            },
            client: {
              select: { id: true, name: true, company: true }
            },
            ...(includeActionItems && {
              meetingMinutes: {
                include: {
                  assignee: {
                    select: { id: true, name: true, employeeId: true }
                  }
                },
                orderBy: { serialNo: 'asc' }
              }
            }),
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true
              },
              take: 5
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { meetingDate: 'desc' }
        }),
        prisma.meeting.count({ where })
      ]);

      // Transform meetings with computed fields
      const transformedMeetings = meetings.map(meeting => {
        const actionItems = meeting.meetingMinutes || [];
        const completedItems = actionItems.filter(item => item.isDone);
        const isOverdue = meeting.deadlineDate && 
          new Date(meeting.deadlineDate) < new Date() && 
          meeting.status !== 'completed';

        return {
          id: meeting.id,
          title: meeting.title,
          description: meeting.description,
          taskId: meeting.taskId,
          meetingType: meeting.meetingType,
          clientId: meeting.clientId,
          client: meeting.client,
          location: meeting.location,
          locationType: meeting.locationType,
          latitude: meeting.latitude,
          longitude: meeting.longitude,
          locationAddress: meeting.locationAddress,
          meetingDate: meeting.meetingDate,
          meetingTime: meeting.meetingTime,
          durationMinutes: meeting.durationMinutes,
          createdBy: meeting.createdBy,
          createdByName: meeting.createdByName,
          creator: meeting.creator,
          assignedTo: meeting.assignedTo,
          assignedToName: meeting.assignedToName,
          assignee: meeting.assignee,
          deadlineDate: meeting.deadlineDate,
          deadlineTime: meeting.deadlineTime,
          priority: meeting.priority,
          status: meeting.status,
          actionItemsCount: meeting.actionItemsCount,
          completedActionItems: meeting.completedActionItems,
          attendeeCount: meeting.attendeeCount,
          createdAt: meeting.createdAt,
          updatedAt: meeting.updatedAt,
          
          // Computed fields
          actualActionItemsCount: actionItems.length,
          actualCompletedItems: completedItems.length,
          completionPercentage: actionItems.length > 0 ? 
            (completedItems.length / actionItems.length) * 100 : 0,
          isOverdue,
          daysUntilDeadline: meeting.deadlineDate ? 
            Math.ceil((new Date(meeting.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
          relatedTasks: meeting.tasks,
          
          // Include action items if requested
          ...(includeActionItems && { actionItems })
        };
      });

      // Calculate summary statistics
      const summary = {
        total: totalCount,
        scheduled: meetings.filter(m => m.status === 'scheduled').length,
        completed: meetings.filter(m => m.status === 'completed').length,
        cancelled: meetings.filter(m => m.status === 'cancelled').length,
        overdue: transformedMeetings.filter(m => m.isOverdue).length,
        byType: {
          internal: meetings.filter(m => m.meetingType === 'internal').length,
          external: meetings.filter(m => m.meetingType === 'external').length
        },
        byPriority: {
          critical: meetings.filter(m => m.priority === 'CRITICAL').length,
          high: meetings.filter(m => m.priority === 'HIGH').length,
          medium: meetings.filter(m => m.priority === 'MEDIUM').length,
          low: meetings.filter(m => m.priority === 'LOW').length
        },
        totalActionItems: meetings.reduce((sum, m) => sum + (m.actionItemsCount || 0), 0),
        completedActionItems: meetings.reduce((sum, m) => sum + (m.completedActionItems || 0), 0)
      };

      await logApiAction(user.id, 'VIEW', 'meetings', undefined, { 
        count: meetings.length,
        filters: { status, meetingType, assignedTo }
      });

      return successResponse({
        meetings: transformedMeetings,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching meetings:', error);
      return errorResponse('Failed to fetch meetings');
    }
  }
);

// POST /api/meetings/enhanced - Create meeting with action items
export const POST = withAuth(
  async (request, user) => {
    try {
      const data = await request.json();

      // Validate required fields
      if (!data.title || !data.meetingDate || !data.assignedTo) {
        return errorResponse('Title, meetingDate, and assignedTo are required');
      }

      const newMeeting = await prisma.$transaction(async (tx) => {
        // Create meeting
        const meeting = await tx.meeting.create({
          data: {
            title: data.title,
            description: data.description,
            taskId: data.taskId,
            meetingType: data.meetingType || 'internal',
            clientId: data.clientId,
            location: data.location,
            locationType: data.locationType || 'office',
            latitude: data.latitude,
            longitude: data.longitude,
            locationAddress: data.locationAddress,
            meetingDate: data.meetingDate,
            meetingTime: data.meetingTime || '10:00:00',
            durationMinutes: parseInt(data.duration) || 60,
            createdBy: user.id,
            createdByName: user.name,
            assignedTo: data.assignedTo,
            assignedToName: data.assignedToName,
            deadlineDate: data.deadlineDate,
            deadlineTime: data.deadlineTime,
            priority: data.priority || 'MEDIUM',
            status: 'scheduled',
            organizationId: user.organizationId,
            actionItemsCount: data.meetingMinutes?.length || 0,
            completedActionItems: 0,
            attendeeCount: (data.internalAttendees?.length || 0) + (data.externalAttendees?.length || 0)
          }
        });

        // Create action items (meeting minutes)
        if (data.meetingMinutes && data.meetingMinutes.length > 0) {
          const actionItems = data.meetingMinutes.map((item: any) => ({
            meetingId: meeting.id,
            organizationId: user.organizationId,
            serialNo: item.serialNo || 1,
            responsibility: item.responsibility,
            assignedToId: item.assignedToId,
            assignedToName: item.assignedToName,
            deadline: item.deadline,
            remarks: item.remarks,
            isDone: false
          }));

          await tx.meetingMinute.createMany({
            data: actionItems
          });
        }

        // Create notification for assigned person
        await tx.notification.create({
          data: {
            userId: data.assignedTo,
            organizationId: user.organizationId,
            message: `You have been assigned to a new meeting: ${data.title} scheduled for ${data.meetingDate}`,
            requestType: 'meeting'
          }
        });

        // Notify action item assignees
        if (data.meetingMinutes && data.meetingMinutes.length > 0) {
          const uniqueAssignees = [...new Set(data.meetingMinutes.map((item: any) => item.assignedToId))];
          const notifications = uniqueAssignees.map((assigneeId: string) => ({
            userId: assigneeId,
            organizationId: user.organizationId,
            message: `You have been assigned action items from meeting: ${data.title}`,
            requestType: 'meeting_action_item'
          }));

          await tx.notification.createMany({
            data: notifications
          });
        }

        return meeting;
      });

      await logApiAction(user.id, 'CREATE', 'meeting', newMeeting.id, { 
        title: data.title,
        actionItemsCount: data.meetingMinutes?.length || 0
      });

      return successResponse(newMeeting, 201);

    } catch (error) {
      console.error('Error creating meeting:', error);
      return errorResponse('Failed to create meeting');
    }
  }
);

// PUT /api/meetings/enhanced - Bulk update meetings
export const PUT = withAuth(
  async (request, user) => {
    try {
      const { meetingIds, updates } = await request.json();

      if (!meetingIds || !Array.isArray(meetingIds) || !updates) {
        return errorResponse('meetingIds (array) and updates are required');
      }

      // Check permissions
      const meetings = await prisma.meeting.findMany({
        where: {
          id: { in: meetingIds },
          organizationId: user.organizationId
        },
        select: { id: true, createdBy: true, assignedTo: true }
      });

      if (meetings.length !== meetingIds.length) {
        return errorResponse('Some meetings not found');
      }

      const canUpdate = meetings.every(meeting => 
        meeting.createdBy === user.id || 
        meeting.assignedTo === user.id ||
        ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)
      );

      if (!canUpdate) {
        return errorResponse('Insufficient permissions');
      }

      const updatedMeetings = await prisma.meeting.updateMany({
        where: { id: { in: meetingIds } },
        data: updates
      });

      await logApiAction(user.id, 'BULK_UPDATE', 'meetings', undefined, { 
        meetingIds,
        updates: Object.keys(updates),
        count: updatedMeetings.count 
      });

      return successResponse({
        message: `Updated ${updatedMeetings.count} meetings`,
        updatedCount: updatedMeetings.count
      });

    } catch (error) {
      console.error('Error bulk updating meetings:', error);
      return errorResponse('Failed to update meetings');
    }
  }
);