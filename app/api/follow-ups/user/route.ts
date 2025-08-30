import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction 
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/follow-ups/user - Get user's meeting action items (follow-ups)
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const userId = searchParams.get('userId') || user.id;
      const organizationId = user.organizationId;

      // Check if user can access the requested user's data
      if (userId !== user.id && !['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied', 403);
      }

      // Get all meeting minutes (action items) assigned to the user
      const meetingMinutes = await dbHandler.prisma.meetingMinute.findMany({
        where: {
          assignedToId: userId,
          organizationId,
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              meetingDate: true,
              meetingTime: true,
              status: true,
              createdByName: true
            }
          },
          assignee: {
            select: {
              id: true,
              name: true,
              employeeId: true
            }
          }
        },
        orderBy: {
          deadline: 'asc'
        }
      });

      // Transform the data to match the expected format
      const transformedData = meetingMinutes.map((item: any) => ({
        id: item.id,
        meeting_id: item.meetingId,
        meeting_title: item.meeting?.title || 'N/A',
        meeting_date: item.meeting?.meetingDate || '',
        meeting_time: item.meeting?.meetingTime || '',
        meeting_status: item.meeting?.status || 'unknown',
        meeting_created_by: item.meeting?.createdByName || 'N/A',
        responsibility: item.responsibility,
        assigned_to_name: item.assignedToName,
        deadline: item.deadline,
        deadline_time: null, // Not in current schema, can be added if needed
        priority: 'medium', // Default priority, can be enhanced
        remarks: item.remarks || '',
        is_done: item.isDone,
        completion_status: item.isDone ? 'completed' : 'pending',
        completion_percentage: item.isDone ? 100 : 0,
        flags: '', // Can be enhanced based on requirements
        completed_by: null, // Can be added to schema if needed
        completed_at: null, // Can be added to schema if needed
        created_at: item.createdAt,
        updated_at: item.updatedAt
      }));

      // Calculate statistics
      const stats = {
        total: transformedData.length,
        completed: transformedData.filter((item: any) => item.is_done).length,
        pending: transformedData.filter((item: any) => !item.is_done).length,
        overdue: transformedData.filter((item: any) => 
          !item.is_done && 
          item.deadline && 
          new Date(item.deadline) < new Date()
        ).length
      };

      await logApiAction(user.id, 'VIEW', 'follow_ups', undefined, { 
        userId, 
        count: transformedData.length 
      });

      return successResponse({
        actionItems: transformedData,
        stats
      });

    } catch (error) {
      console.error('Error fetching user follow-ups:', error);
      return errorResponse('Failed to fetch follow-ups');
    }
  }
);

// PATCH /api/follow-ups/user - Update action item status
export const PATCH = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const itemId = searchParams.get('itemId');
      
      if (!itemId) {
        return errorResponse('Item ID is required', 400);
      }

      const body = await request.json();
      const { is_done } = body;

      // Check if the action item exists and user has access
      const existingItem = await dbHandler.prisma.meetingMinute.findUnique({
        where: { id: itemId },
        select: { 
          id: true, 
          assignedToId: true, 
          organizationId: true,
          responsibility: true
        }
      });

      if (!existingItem) {
        return errorResponse('Action item not found', 404);
      }

      if (existingItem.organizationId !== user.organizationId) {
        return errorResponse('Access denied', 403);
      }

      // Only the assignee or admins can update
      if (existingItem.assignedToId !== user.id && 
          !['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied', 403);
      }

      // Update the action item
      const updatedItem = await dbHandler.prisma.meetingMinute.update({
        where: { id: itemId },
        data: {
          isDone: is_done
        }
      });

      await logApiAction(user.id, 'UPDATE', 'meeting_minute', itemId, { 
        action: is_done ? 'completed' : 'reopened'
      });

      return successResponse({
        item: updatedItem,
        message: `Action item marked as ${is_done ? 'completed' : 'pending'}`
      });

    } catch (error) {
      console.error('Error updating follow-up item:', error);
      return errorResponse('Failed to update action item');
    }
  }
);