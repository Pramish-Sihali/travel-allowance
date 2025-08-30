// app/api/meetings/route.ts
// Enhanced Meetings API with Role-Based Access and Action Items Integration

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/meetings - Get meetings with comprehensive filtering and action items
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
      // HR_ADMIN, ADMIN, SUPER_ADMIN can see all meetings (no additional filter)

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
        dbHandler.prisma.meeting.findMany({
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
        dbHandler.prisma.meeting.count({ where })
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
      const currentDate = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const summary = {
        total: totalCount,
        scheduled: transformedMeetings.filter(m => m.status === 'scheduled').length,
        completed: transformedMeetings.filter(m => m.status === 'completed').length,
        cancelled: transformedMeetings.filter(m => m.status === 'cancelled').length,
        overdue: transformedMeetings.filter(m => m.isOverdue).length,
        upcomingDeadlines: transformedMeetings.filter(m => 
          m.deadlineDate && 
          new Date(m.deadlineDate) >= currentDate && 
          new Date(m.deadlineDate) <= nextWeek && 
          m.status !== 'completed'
        ).length,
        byType: {
          internal: transformedMeetings.filter(m => m.meetingType === 'internal').length,
          external: transformedMeetings.filter(m => m.meetingType === 'external').length
        },
        byPriority: {
          critical: transformedMeetings.filter(m => m.priority === 'CRITICAL').length,
          high: transformedMeetings.filter(m => m.priority === 'HIGH').length,
          medium: transformedMeetings.filter(m => m.priority === 'MEDIUM').length,
          low: transformedMeetings.filter(m => m.priority === 'LOW').length
        },
        totalActionItems: transformedMeetings.reduce((sum, m) => sum + (m.actualActionItemsCount || 0), 0),
        completedActionItems: transformedMeetings.reduce((sum, m) => sum + (m.actualCompletedItems || 0), 0)
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

// POST /api/meetings - Create new meeting with action items
export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.title || !body.meetingDate || !body.meetingType) {
        return errorResponse('Title, meetingDate, and meetingType are required', 400);
      }

      const newMeeting = await dbHandler.prisma.$transaction(async (tx) => {
        // Handle client creation if needed
        let clientId = body.clientId;
        if (body.meetingType === 'external' && body.newClientName && !body.clientId) {
          const client = await tx.client.create({
            data: {
              name: body.newClientName,
              clientType: 'NEW',
              organizationId: user.organizationId
            }
          });
          clientId = client.id;
        }

        // Get assigned user name if assignedTo is provided
        let assignedToName = body.assignedToName;
        if (body.assignedTo && !assignedToName) {
          const assignedUser = await tx.user.findUnique({
            where: { id: body.assignedTo },
            select: { name: true }
          });
          assignedToName = assignedUser?.name;
        }

        // Create meeting
        const meeting = await tx.meeting.create({
          data: {
            title: body.title,
            description: body.description || null,
            taskId: body.taskId || null,
            meetingType: body.meetingType,
            clientId: clientId || null,
            location: body.locationDetails || body.location,
            locationType: body.locationType || 'office',
            latitude: body.currentLocation?.lat || body.latitude,
            longitude: body.currentLocation?.lng || body.longitude,
            locationAddress: body.currentLocation?.address || body.locationAddress,
            meetingDate: body.meetingDate,
            meetingTime: body.meetingTime || '10:00:00',
            durationMinutes: body.duration ? parseInt(body.duration) : 60,
            createdBy: user.id,
            createdByName: user.name,
            assignedTo: body.assignedTo || null,
            assignedToName: assignedToName || null,
            deadlineDate: body.deadlineDate || null,
            deadlineTime: body.deadlineTime || null,
            priority: body.priority || 'MEDIUM',
            status: 'scheduled',
            organizationId: user.organizationId,
            actionItemsCount: body.meetingMinutes?.length || 0,
            completedActionItems: 0,
            attendeeCount: (body.internalAttendees?.length || 0) + (body.externalAttendees?.length || 0)
          }
        });

        // Add internal attendees
        if (body.internalAttendees && body.internalAttendees.length > 0) {
          const internalAttendeesData = body.internalAttendees.map((attendee: any) => ({
            meetingId: meeting.id,
            userId: attendee.id,
            attendeeName: attendee.name,
            attendeeEmail: attendee.email,
            attendeeType: 'INTERNAL',
            organizationId: user.organizationId
          }));

          await tx.meetingAttendee.createMany({
            data: internalAttendeesData
          });
        }

        // Add external attendees
        if (body.externalAttendees && body.externalAttendees.length > 0) {
          const externalAttendeesData = body.externalAttendees.map((attendee: any) => ({
            meetingId: meeting.id,
            userId: null,
            attendeeName: attendee.name,
            attendeeEmail: attendee.email,
            attendeeOrganization: attendee.organization || null,
            attendeeType: 'EXTERNAL',
            organizationId: user.organizationId
          }));

          await tx.meetingAttendee.createMany({
            data: externalAttendeesData
          });
        }

        // Add absentees
        if (body.absentees && body.absentees.length > 0) {
          const absenteesData = body.absentees.map((absentee: any) => ({
            meetingId: meeting.id,
            userId: absentee.id,
            attendeeName: absentee.name,
            attendeeEmail: absentee.email,
            attendeeType: 'ABSENTEE',
            absenteeReason: absentee.reason || null,
            organizationId: user.organizationId
          }));

          await tx.meetingAttendee.createMany({
            data: absenteesData
          });
        }

        // Create action items (meeting minutes)
        if (body.meetingMinutes && body.meetingMinutes.length > 0) {
          const actionItems = body.meetingMinutes.map((item: any) => ({
            meetingId: meeting.id,
            organizationId: user.organizationId,
            serialNo: item.serialNo || 1,
            responsibility: item.responsibility,
            assignedToId: item.assignedToId,
            assignedToName: item.assignedToName,
            deadline: item.deadline,
            remarks: item.remarks,
            isDone: item.isDone || false
          }));

          await tx.meetingMinute.createMany({
            data: actionItems
          });
        }

        // Create notification for assigned person
        if (body.assignedTo) {
          await tx.notification.create({
            data: {
              userId: body.assignedTo,
              organizationId: user.organizationId,
              message: `You have been assigned to a new meeting: ${body.title} scheduled for ${body.meetingDate}`,
              requestType: 'meeting'
            }
          });
        }

        // Notify action item assignees
        if (body.meetingMinutes && body.meetingMinutes.length > 0) {
          const uniqueAssignees = [...new Set(body.meetingMinutes.map((item: any) => item.assignedToId).filter(Boolean))];
          const notifications = uniqueAssignees.map((assigneeId: string) => ({
            userId: assigneeId,
            organizationId: user.organizationId,
            message: `You have been assigned action items from meeting: ${body.title}`,
            requestType: 'meeting_action_item'
          }));

          if (notifications.length > 0) {
            await tx.notification.createMany({
              data: notifications
            });
          }
        }

        // Create deadline assignment if assigned to someone
        if (body.assignedTo && body.deadlineDate) {
          await tx.meetingDeadlineAssignment.create({
            data: {
              meetingId: meeting.id,
              assignedTo: body.assignedTo,
              assignedToName: assignedToName || '',
              assignedBy: user.id,
              assignedByName: user.name,
              assignmentType: 'MEETING',
              deadlineDate: body.deadlineDate,
              deadlineTime: body.deadlineTime,
              priority: body.priority || 'MEDIUM',
              description: `Meeting follow-up: ${body.title}`,
              completionStatus: 'ASSIGNED',
              organizationId: user.organizationId
            }
          });
        }

        return meeting;
      });

      await logApiAction(user.id, 'CREATE', 'meeting', newMeeting.id, { 
        title: body.title,
        actionItemsCount: body.meetingMinutes?.length || 0
      });

      return successResponse({
        success: true,
        meetingId: newMeeting.id,
        meeting: newMeeting,
        message: 'Meeting created successfully'
      }, 201);

    } catch (error) {
      console.error('Error creating meeting:', error);
      return errorResponse('Failed to create meeting');
    }
  }
);