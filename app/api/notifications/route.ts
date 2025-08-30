// app/api/notifications/route.ts
// Enhanced Notifications API with Role-Based Access

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/notifications - Get notifications with filtering and pagination
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const userId = searchParams.get('userId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const requestType = searchParams.get('requestType');
      
      // Determine target user ID
      const targetUserId = userId || user.id;
      
      // Check access permissions
      if (targetUserId !== user.id && !['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied - You can only access your own notifications', 403);
      }

      let where: any = {
        userId: targetUserId,
        organizationId: user.organizationId
      };

      // Apply filters
      if (unreadOnly) where.isRead = false;
      if (requestType) where.requestType = requestType;

      const [notifications, totalCount, unreadCount] = await Promise.all([
        // Get notifications
        dbHandler.prisma.notification.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        
        // Get total count
        dbHandler.prisma.notification.count({ where }),
        
        // Get unread count
        dbHandler.prisma.notification.count({
          where: {
            userId: targetUserId,
            organizationId: user.organizationId,
            isRead: false
          }
        })
      ]);

      // Group notifications by type for summary
      const notificationsByType = notifications.reduce((acc, notification) => {
        const type = notification.requestType || 'general';
        if (!acc[type]) acc[type] = [];
        acc[type].push(notification);
        return acc;
      }, {} as Record<string, any[]>);

      await logApiAction(user.id, 'VIEW', 'notifications', undefined, { 
        targetUserId,
        count: notifications.length
      });

      return successResponse({
        notifications,
        summary: {
          total: totalCount,
          unread: unreadCount,
          read: totalCount - unreadCount,
          byType: Object.keys(notificationsByType).reduce((acc, type) => {
            acc[type] = notificationsByType[type].length;
            return acc;
          }, {} as Record<string, number>)
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      return errorResponse('Failed to fetch notifications');
    }
  }
);

// POST /api/notifications - Create new notification (admin only)
export const POST = withAuth(
  async (request, user) => {
    try {
      // Only admins can create notifications
      if (!['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied - Insufficient permissions', 403);
      }

      const body = await request.json();
      const { userId, message, requestType, requestId } = body;

      if (!userId || !message) {
        return errorResponse('User ID and message are required', 400);
      }

      // Verify target user exists in the same organization
      const targetUser = await dbHandler.prisma.user.findFirst({
        where: { 
          id: userId, 
          organizationId: user.organizationId 
        }
      });

      if (!targetUser) {
        return errorResponse('Target user not found', 404);
      }

      const notification = await dbHandler.prisma.notification.create({
        data: {
          userId,
          organizationId: user.organizationId,
          message,
          requestType: requestType || 'general',
          requestId,
          isRead: false
        }
      });

      await logApiAction(user.id, 'CREATE', 'notification', notification.id, {
        targetUserId: userId,
        requestType
      });

      return successResponse(notification, 201);

    } catch (error) {
      console.error('Error creating notification:', error);
      return errorResponse('Failed to create notification');
    }
  }
);

// PUT /api/notifications - Mark notifications as read
export const PUT = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { notificationIds, markAsRead = true } = body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return errorResponse('Notification IDs array is required', 400);
      }

      // Verify user owns these notifications
      const existingNotifications = await dbHandler.prisma.notification.findMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
          organizationId: user.organizationId
        }
      });

      if (existingNotifications.length !== notificationIds.length) {
        return errorResponse('Some notifications not found or access denied', 403);
      }

      // Update notifications
      const updatedNotifications = await dbHandler.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
          organizationId: user.organizationId
        },
        data: {
          isRead: markAsRead,
          readAt: markAsRead ? new Date() : null
        }
      });

      await logApiAction(user.id, 'UPDATE', 'notifications', undefined, {
        action: markAsRead ? 'mark_read' : 'mark_unread',
        count: updatedNotifications.count
      });

      return successResponse({
        message: `Marked ${updatedNotifications.count} notifications as ${markAsRead ? 'read' : 'unread'}`,
        updatedCount: updatedNotifications.count
      });

    } catch (error) {
      console.error('Error updating notifications:', error);
      return errorResponse('Failed to update notifications');
    }
  }
);