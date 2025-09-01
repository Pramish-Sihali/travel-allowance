// app/api/tasks/route.ts
// Enhanced Task Management API with Action Items and Meeting Integration

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/tasks - Get tasks with comprehensive filtering and meeting action items
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const department = searchParams.get('department');
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');
      const ragStatus = searchParams.get('ragStatus');
      const assignedTo = searchParams.get('assignedTo');
      const search = searchParams.get('search');
      const includeActionItems = searchParams.get('includeActionItems') !== 'false';
      const myTasks = searchParams.get('myTasks') === 'true';
      const overdue = searchParams.get('overdue') === 'true';

      let where: any = {
        organizationId: user.organizationId
      };

      // Role-based filtering
      if (user.role === 'EMPLOYEE' || myTasks) {
        where.OR = [
          { createdBy: user.id },
          { assignedUserIds: { has: user.id } }
        ];
      } else if (user.role === 'MANAGER') {
        // Managers can see their team's tasks
        const teamMembers = await dbHandler.prisma.user.findMany({
          where: { managerId: user.id, organizationId: user.organizationId },
          select: { id: true }
        });
        const teamIds = teamMembers.map(m => m.id);
        where.OR = [
          { createdBy: user.id },
          { assignedUserIds: { has: user.id } },
          { createdBy: { in: teamIds } },
          { assignedUserIds: { hasSome: teamIds } }
        ];
      }
      // HR_ADMIN, ADMIN, SUPER_ADMIN can see all tasks (no additional filter)

      // Apply filters
      if (department && department !== 'all') where.departmentId = department;
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (ragStatus) where.ragStatus = ragStatus;
      if (assignedTo) where.assignedUserIds = { has: assignedTo };
      if (overdue) {
        where.dueDate = { lt: new Date().toISOString() };
        where.status = { not: 'COMPLETED' };
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { remarks: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [tasks, totalCount] = await Promise.all([
        dbHandler.prisma.task.findMany({
          where,
          include: {
            creator: {
              select: { id: true, name: true, employeeId: true }
            },
            department: {
              select: { id: true, name: true }
            },
            actionItems: {
              include: {
                assignee: {
                  select: { id: true, name: true, employeeId: true }
                }
              },
              orderBy: { serialNo: 'asc' }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        dbHandler.prisma.task.count({ where })
      ]);

      // Get meeting action items if requested
      let meetingActionItems: any[] = [];
      if (includeActionItems) {
        const actionItemWhere: any = {
          organizationId: user.organizationId
        };

        if (user.role === 'EMPLOYEE' || myTasks) {
          actionItemWhere.assignedToId = user.id;
        } else if (user.role === 'MANAGER') {
          const teamMembers = await dbHandler.prisma.user.findMany({
            where: { managerId: user.id, organizationId: user.organizationId },
            select: { id: true }
          });
          const teamIds = teamMembers.map(m => m.id);
          actionItemWhere.assignedToId = { in: [user.id, ...teamIds] };
        }

        meetingActionItems = await dbHandler.prisma.meetingMinute.findMany({
          where: actionItemWhere,
          include: {
            meeting: {
              select: {
                id: true,
                title: true,
                meetingDate: true,
                meetingType: true,
                createdByName: true
              }
            },
            assignee: {
              select: { id: true, name: true, employeeId: true }
            }
          },
          orderBy: { deadline: 'asc' }
        });
      }

      // Transform tasks with computed fields
      const transformedTasks = tasks.map(task => {
        const actionItems = task.actionItems || [];
        const completedItems = actionItems.filter(item => item.status === 'COMPLETED');
        const isOverdue = task.dueDate && 
          new Date(task.dueDate) < new Date() && 
          task.status !== 'COMPLETED';

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          departmentId: task.departmentId,
          departmentName: task.department?.name || task.departmentName,
          assignedTo: task.assignedTo,
          assignedUserIds: task.assignedUserIds,
          status: task.status,
          priority: task.priority,
          ragStatus: task.ragStatus,
          dueDate: task.dueDate,
          startDate: task.startDate,
          completionDate: task.completionDate,
          bottlenecks: task.bottlenecks,
          ragTakeaway: task.ragTakeaway,
          remarks: task.remarks,
          createdBy: task.createdBy,
          createdByName: task.createdByName,
          creator: task.creator,
          lastUpdatedBy: task.lastUpdatedBy,
          lastUpdatedByName: task.lastUpdatedByName,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          
          // Computed fields
          actionItemsCount: actionItems.length,
          completedActionItems: completedItems.length,
          completionPercentage: actionItems.length > 0 ? 
            (completedItems.length / actionItems.length) * 100 : 0,
          isOverdue,
          daysUntilDue: task.dueDate ? 
            Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
          
          // Include action items details
          actionItems: actionItems.map(item => ({
            id: item.id,
            serialNo: item.serialNo,
            title: item.title,
            description: item.description,
            assignedToId: item.assignedToId,
            assignedToName: item.assignedToName,
            assignee: item.assignee,
            dueDate: item.dueDate,
            priority: item.priority,
            status: item.status,
            remarks: item.remarks,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }))
        };
      });

      // Transform meeting action items to task-like format
      const meetingTaskItems = meetingActionItems.map(item => ({
        id: `meeting-${item.id}`,
        title: `[Meeting Action] ${item.responsibility}`,
        description: `From meeting: ${item.meeting?.title || 'Unknown Meeting'} (${
          item.meeting?.meetingDate ? new Date(item.meeting.meetingDate).toLocaleDateString() : 'No date'
        })`,
        department: 'meeting-actions',
        departmentName: 'Meeting Actions',
        assignedTo: [item.assignedToName || 'Unknown'],
        assignedUserIds: [item.assignedToId],
        status: item.isDone ? 'COMPLETED' : 'IN_PROGRESS',
        priority: 'MEDIUM',
        ragStatus: item.isDone ? 'GREEN' : 'AMBER',
        dueDate: item.deadline,
        startDate: null,
        completionDate: item.isDone ? item.updatedAt : null,
        bottlenecks: null,
        ragTakeaway: null,
        remarks: item.remarks || `Meeting Action Item from: ${item.meeting?.title || 'Unknown Meeting'}`,
        createdBy: null,
        createdByName: item.meeting?.createdByName,
        creator: null,
        lastUpdatedBy: null,
        lastUpdatedByName: null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        
        // Meeting-specific fields
        isMeetingActionItem: true,
        meetingActionItemId: item.id,
        meetingId: item.meetingId,
        meetingTitle: item.meeting?.title,
        
        // Computed fields
        actionItemsCount: 0,
        completedActionItems: 0,
        completionPercentage: item.isDone ? 100 : 0,
        isOverdue: item.deadline && new Date(item.deadline) < new Date() && !item.isDone,
        daysUntilDue: item.deadline ? 
          Math.ceil((new Date(item.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
        actionItems: []
      }));

      // Combine all tasks
      const allTasks = [...transformedTasks, ...meetingTaskItems];

      // Calculate summary statistics
      const summary = {
        total: totalCount + meetingActionItems.length,
        regularTasks: totalCount,
        meetingActionItems: meetingActionItems.length,
        byStatus: {
          notStarted: allTasks.filter(t => t.status === 'NOT_STARTED').length,
          inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
          completed: allTasks.filter(t => t.status === 'COMPLETED').length,
          onHold: allTasks.filter(t => t.status === 'ON_HOLD').length,
          cancelled: allTasks.filter(t => t.status === 'CANCELLED').length
        },
        byPriority: {
          critical: allTasks.filter(t => t.priority === 'CRITICAL').length,
          high: allTasks.filter(t => t.priority === 'HIGH').length,
          medium: allTasks.filter(t => t.priority === 'MEDIUM').length,
          low: allTasks.filter(t => t.priority === 'LOW').length
        },
        byRagStatus: {
          red: allTasks.filter(t => t.ragStatus === 'RED').length,
          amber: allTasks.filter(t => t.ragStatus === 'AMBER').length,
          green: allTasks.filter(t => t.ragStatus === 'GREEN').length,
          unrated: allTasks.filter(t => t.ragStatus === 'UNRATED').length
        },
        overdue: allTasks.filter(t => t.isOverdue).length,
        dueThisWeek: allTasks.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return dueDate <= weekFromNow && dueDate >= new Date();
        }).length
      };

      await logApiAction(user.id, 'VIEW', 'tasks', undefined, { 
        count: allTasks.length,
        filters: { department, status, priority, myTasks }
      });

      return successResponse({
        tasks: allTasks,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount + meetingActionItems.length,
          pages: Math.ceil((totalCount + meetingActionItems.length) / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching tasks:', error);
      return errorResponse('Failed to fetch tasks');
    }
  }
);

// POST /api/tasks - Create new task with action items
export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      if (!body.title || !body.departmentId) {
        return errorResponse('Title and departmentId are required', 400);
      }

      const newTask = await dbHandler.prisma.$transaction(async (tx) => {
        // Create main task
        const task = await tx.task.create({
          data: {
            title: body.title,
            description: body.description || '',
            departmentId: body.departmentId,
            departmentName: body.departmentName || '',
            assignedTo: body.assignedTo || [],
            assignedUserIds: body.assignedUserIds || [],
            status: body.status || 'NOT_STARTED',
            priority: body.priority || 'MEDIUM',
            ragStatus: body.ragStatus || 'UNRATED',
            dueDate: body.dueDate || null,
            startDate: body.startDate || null,
            bottlenecks: body.bottlenecks || '',
            ragTakeaway: body.ragTakeaway || '',
            remarks: body.remarks || '',
            createdBy: user.id,
            createdByName: user.name,
            lastUpdatedBy: user.id,
            lastUpdatedByName: user.name,
            organizationId: user.organizationId
          },
          include: {
            creator: {
              select: { id: true, name: true, employeeId: true }
            },
            department: {
              select: { id: true, name: true }
            }
          }
        });

        // Create action items if provided
        if (body.actionItems && body.actionItems.length > 0) {
          const actionItems = body.actionItems.map((item: any, index: number) => ({
            taskId: task.id,
            organizationId: user.organizationId,
            serialNo: item.serialNo || (index + 1),
            title: item.title || `Action Item ${index + 1}`,
            description: item.description || '',
            assignedToId: item.assignedToId,
            assignedToName: item.assignedToName,
            dueDate: item.dueDate,
            priority: item.priority || 'MEDIUM',
            status: item.status || 'NOT_STARTED',
            remarks: item.remarks || '',
            createdBy: user.id
          }));

          await tx.taskActionItem.createMany({
            data: actionItems
          });
        }

        // Create notifications for assigned users
        if (body.assignedUserIds && body.assignedUserIds.length > 0) {
          const notifications = body.assignedUserIds.map((assigneeId: string) => ({
            userId: assigneeId,
            organizationId: user.organizationId,
            message: `You have been assigned to a new task: ${body.title}`,
            requestType: 'task'
          }));

          await tx.notification.createMany({
            data: notifications
          });
        }

        return task;
      });

      await logApiAction(user.id, 'CREATE', 'task', newTask.id, {
        title: body.title,
        actionItemsCount: body.actionItems?.length || 0
      });

      return successResponse(newTask, 201);

    } catch (error) {
      console.error('Error creating task:', error);
      return errorResponse('Failed to create task');
    }
  }
);