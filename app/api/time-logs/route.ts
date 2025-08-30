// app/api/time-logs/route.ts
// Enhanced Time Logs API with Role-Based Access

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/time-logs - Get time logs with comprehensive filtering
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const userId = searchParams.get('userId') || user.id;
      const date = searchParams.get('date');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const taskId = searchParams.get('taskId');
      const taskType = searchParams.get('taskType');
      const personal = searchParams.get('personal') === 'true';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');

      // Check access permissions
      if (userId !== user.id && !['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user.role)) {
        return errorResponse('Access denied - You can only access your own time logs', 403);
      }

      // If user is a manager, verify they can access the requested user's data
      if (user.role === 'MANAGER' && userId !== user.id) {
        const targetUser = await dbHandler.prisma.user.findFirst({
          where: { 
            id: userId, 
            managerId: user.id,
            organizationId: user.organizationId 
          }
        });
        if (!targetUser) {
          return errorResponse('Access denied - User is not in your team', 403);
        }
      }

      let where: any = {
        userId,
        organizationId: user.organizationId,
        isPersonal: personal
      };

      // Apply date filters
      if (date) {
        where.date = date;
      } else if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = dateFrom;
        if (dateTo) where.date.lte = dateTo;
      }

      // Apply other filters
      if (taskId) where.taskId = taskId;
      if (taskType) where.taskType = taskType;

      const [timeLogs, totalCount] = await Promise.all([
        dbHandler.prisma.timeLog.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, employeeId: true }
            },
            task: {
              select: { id: true, title: true, status: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        dbHandler.prisma.timeLog.count({ where })
      ]);

      // Transform with computed fields
      const transformedTimeLogs = timeLogs.map(log => ({
        id: log.id,
        userId: log.userId,
        taskId: log.taskId,
        organizationId: log.organizationId,
        description: log.description,
        date: log.date,
        startTime: log.startTime,
        endTime: log.endTime,
        totalDuration: log.totalDuration,
        breakDuration: log.breakDuration,
        hoursSpent: log.hoursSpent,
        taskType: log.taskType,
        isPersonal: log.isPersonal,
        meetingActionItemId: log.meetingActionItemId,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        
        // Related data
        user: log.user,
        task: log.task,
        userName: log.user?.name,
        taskTitle: log.task?.title || (log.meetingActionItemId ? `Meeting Action Item ${log.meetingActionItemId}` : null),
        
        // Computed fields
        actualHours: log.totalDuration ? Math.round((log.totalDuration / 3600) * 100) / 100 : log.hoursSpent,
        isLongSession: log.totalDuration > 8 * 3600, // More than 8 hours
        hasBreaks: log.breakDuration > 0
      }));

      // Calculate summary statistics
      const totalHours = transformedTimeLogs.reduce((sum, log) => 
        sum + (log.actualHours || 0), 0
      );
      const totalDays = new Set(transformedTimeLogs.map(log => log.date)).size;
      const taskTypes = transformedTimeLogs.reduce((acc, log) => {
        const type = log.taskType || 'other';
        acc[type] = (acc[type] || 0) + (log.actualHours || 0);
        return acc;
      }, {} as Record<string, number>);

      const summary = {
        totalLogs: totalCount,
        totalHours: Math.round(totalHours * 100) / 100,
        totalDays,
        averageHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0,
        byTaskType: taskTypes,
        personalLogs: transformedTimeLogs.filter(log => log.isPersonal).length,
        workLogs: transformedTimeLogs.filter(log => !log.isPersonal).length
      };

      await logApiAction(user.id, 'VIEW', 'time_logs', undefined, { 
        targetUserId: userId,
        count: timeLogs.length,
        personal
      });

      return successResponse({
        timeLogs: transformedTimeLogs,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching time logs:', error);
      return errorResponse('Failed to fetch time logs');
    }
  }
);

// POST /api/time-logs - Create new time log
export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      if (!body.description && !body.taskId) {
        return errorResponse('Description or task ID is required', 400);
      }

      if (!body.date) {
        return errorResponse('Date is required', 400);
      }

      // If hoursSpent is provided, validate it
      if (body.hoursSpent && (body.hoursSpent <= 0 || body.hoursSpent > 24)) {
        return errorResponse('Hours spent must be between 0 and 24', 400);
      }

      // Calculate duration if start/end times provided
      let totalDuration = body.totalDuration;
      if (body.startTime && body.endTime && !totalDuration) {
        const start = new Date(`${body.date}T${body.startTime}`);
        const end = new Date(`${body.date}T${body.endTime}`);
        totalDuration = Math.floor((end.getTime() - start.getTime()) / 1000);
      }

      // Calculate hours from duration if not provided
      let hoursSpent = body.hoursSpent;
      if (!hoursSpent && totalDuration) {
        hoursSpent = Math.round((totalDuration / 3600) * 100) / 100;
      }

      // Verify task exists if taskId provided
      if (body.taskId) {
        const task = await dbHandler.prisma.task.findFirst({
          where: {
            id: body.taskId,
            organizationId: user.organizationId
          }
        });

        if (!task) {
          return errorResponse('Task not found', 404);
        }

        // Check if user has access to this task
        if (!['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
          const hasAccess = task.createdBy === user.id || 
                           task.assignedUserIds.includes(user.id);
          if (!hasAccess) {
            return errorResponse('Access denied - You cannot log time to this task', 403);
          }
        }
      }

      const timeLog = await dbHandler.prisma.timeLog.create({
        data: {
          userId: user.id,
          taskId: body.taskId || null,
          organizationId: user.organizationId,
          description: body.description || '',
          date: body.date,
          startTime: body.startTime || null,
          endTime: body.endTime || null,
          totalDuration: totalDuration || null,
          breakDuration: body.breakDuration || 0,
          hoursSpent: hoursSpent || 0,
          taskType: body.taskType || 'development',
          isPersonal: body.isPersonal || false,
          meetingActionItemId: body.meetingActionItemId || null
        },
        include: {
          user: {
            select: { id: true, name: true, employeeId: true }
          },
          task: {
            select: { id: true, title: true, status: true }
          }
        }
      });

      // Update task total hours if this is a task log
      if (body.taskId && hoursSpent) {
        await dbHandler.prisma.task.update({
          where: { id: body.taskId },
          data: {
            totalHoursSpent: {
              increment: hoursSpent
            }
          }
        });
      }

      await logApiAction(user.id, 'CREATE', 'time_log', timeLog.id, {
        taskId: body.taskId,
        hoursSpent,
        isPersonal: body.isPersonal
      });

      return successResponse(timeLog, 201);

    } catch (error) {
      console.error('Error creating time log:', error);
      return errorResponse('Failed to create time log');
    }
  }
);

// PUT /api/time-logs - Update time log
export const PUT = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return errorResponse('Time log ID is required', 400);
      }

      // Verify time log exists and user has access
      const existingLog = await dbHandler.prisma.timeLog.findFirst({
        where: {
          id,
          organizationId: user.organizationId
        }
      });

      if (!existingLog) {
        return errorResponse('Time log not found', 404);
      }

      // Only allow users to update their own logs unless admin
      if (existingLog.userId !== user.id && !['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied - You can only update your own time logs', 403);
      }

      // Calculate duration if start/end times provided
      let totalDuration = updateData.totalDuration;
      if (updateData.startTime && updateData.endTime && !totalDuration) {
        const date = updateData.date || existingLog.date;
        const start = new Date(`${date}T${updateData.startTime}`);
        const end = new Date(`${date}T${updateData.endTime}`);
        totalDuration = Math.floor((end.getTime() - start.getTime()) / 1000);
      }

      // Calculate hours from duration if not provided
      let hoursSpent = updateData.hoursSpent;
      if (!hoursSpent && totalDuration) {
        hoursSpent = Math.round((totalDuration / 3600) * 100) / 100;
      }

      const updatedTimeLog = await dbHandler.prisma.timeLog.update({
        where: { id },
        data: {
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.date !== undefined && { date: updateData.date }),
          ...(updateData.startTime !== undefined && { startTime: updateData.startTime }),
          ...(updateData.endTime !== undefined && { endTime: updateData.endTime }),
          ...(totalDuration !== undefined && { totalDuration }),
          ...(updateData.breakDuration !== undefined && { breakDuration: updateData.breakDuration }),
          ...(hoursSpent !== undefined && { hoursSpent }),
          ...(updateData.taskType !== undefined && { taskType: updateData.taskType }),
          ...(updateData.isPersonal !== undefined && { isPersonal: updateData.isPersonal })
        },
        include: {
          user: {
            select: { id: true, name: true, employeeId: true }
          },
          task: {
            select: { id: true, title: true, status: true }
          }
        }
      });

      await logApiAction(user.id, 'UPDATE', 'time_log', id, {
        changes: Object.keys(updateData)
      });

      return successResponse(updatedTimeLog);

    } catch (error) {
      console.error('Error updating time log:', error);
      return errorResponse('Failed to update time log');
    }
  }
);