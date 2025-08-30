import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/dashboard/employee - Get comprehensive employee dashboard data
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const employeeId = searchParams.get('employeeId') || user.id;
      const period = searchParams.get('period') || 'month'; // month, quarter, year
      const includeHistory = searchParams.get('includeHistory') === 'true';
      
      // Check if user can access the requested employee's data
      if (employeeId !== user.id && !['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user.role)) {
        return errorResponse('Access denied', 403);
      }

      const organizationId = user.organizationId;

      // Calculate date ranges based on period
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          startDate = quarterStart;
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Fetch comprehensive dashboard data
      const [
        travelRequests,
        valleyRequests, 
        notifications,
        timeLogs,
        tasks,
        leaveRequests,
        userProfile
      ] = await Promise.all([
        // Travel requests
        dbHandler.prisma.travelRequest.findMany({
          where: {
            employeeId,
            organizationId,
            ...(includeHistory ? {} : { createdAt: { gte: startDate } })
          },
          include: {
            approver: { select: { id: true, name: true } },
            checker: { select: { id: true, name: true } },
            receipts: {
              select: {
                id: true,
                amount: true,
                category: true,
                fileName: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: includeHistory ? undefined : 50
        }),
        
        // Valley requests
        dbHandler.prisma.valleyRequest.findMany({
          where: {
            employeeId,
            organizationId,
            ...(includeHistory ? {} : { createdAt: { gte: startDate } })
          },
          include: {
            approver: { select: { id: true, name: true } },
            receipts: {
              select: {
                id: true,
                amount: true,
                category: true,
                fileName: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: includeHistory ? undefined : 50
        }),
        
        // Notifications
        dbHandler.prisma.notification.findMany({
          where: {
            userId: employeeId,
            organizationId,
            createdAt: { gte: startDate }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        }),
        
        // Time logs
        dbHandler.prisma.timeLog.findMany({
          where: {
            userId: employeeId,
            organizationId,
            date: {
              gte: startDate.toISOString().split('T')[0],
              lte: now.toISOString().split('T')[0]
            }
          },
          orderBy: { date: 'desc' }
        }),
        
        // Tasks
        dbHandler.prisma.task.findMany({
          where: {
            OR: [
              { assignedUserIds: { has: employeeId } },
              { createdBy: employeeId }
            ],
            organizationId
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }),
        
        // Leave requests
        dbHandler.prisma.leaveRequest.findMany({
          where: {
            employeeId,
            organizationId,
            ...(includeHistory ? {} : { createdAt: { gte: startDate } })
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }),
        
        // User profile with employment details
        dbHandler.prisma.user.findUnique({
          where: { id: employeeId },
          include: {
            employeeProfile: true,
            manager: {
              select: { id: true, name: true, employeeId: true }
            },
            department_relation: {
              select: { id: true, name: true }
            }
          }
        })
      ]);

      // Calculate comprehensive statistics
      const allRequests = [...travelRequests, ...valleyRequests];
      const stats = {
        requests: {
          total: allRequests.length,
          pending: allRequests.filter(req => req.status === 'pending').length,
          approved: allRequests.filter(req => req.status === 'approved').length,
          rejected: allRequests.filter(req => req.status.includes('rejected')).length,
          completed: allRequests.filter(req => req.status === 'completed').length,
          totalAmount: allRequests.reduce((total, req) => total + Number(req.totalAmount || 0), 0),
          approvedAmount: allRequests
            .filter(req => req.status === 'approved')
            .reduce((total, req) => total + Number(req.totalAmount || 0), 0),
          travelCount: travelRequests.length,
          valleyCount: valleyRequests.length,
          waitingForExpenses: allRequests.filter(req => req.status === 'travel_approved').length
        },
        timeTracking: {
          totalHours: timeLogs.reduce((sum, log) => sum + Number(log.hoursSpent || 0), 0),
          workingDays: new Set(timeLogs.map(log => log.date)).size,
          averageHoursPerDay: timeLogs.length > 0 ? 
            timeLogs.reduce((sum, log) => sum + Number(log.hoursSpent || 0), 0) / 
            new Set(timeLogs.map(log => log.date)).size : 0,
          byTaskType: timeLogs.reduce((acc, log) => {
            acc[log.taskType] = (acc[log.taskType] || 0) + Number(log.hoursSpent || 0);
            return acc;
          }, {} as Record<string, number>)
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'COMPLETED').length,
          inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
          pending: tasks.filter(t => t.status === 'PENDING').length,
          overdue: tasks.filter(t => 
            t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED'
          ).length,
          byPriority: {
            critical: tasks.filter(t => t.priority === 'CRITICAL').length,
            high: tasks.filter(t => t.priority === 'HIGH').length,
            medium: tasks.filter(t => t.priority === 'MEDIUM').length,
            low: tasks.filter(t => t.priority === 'LOW').length
          }
        },
        leaves: {
          total: leaveRequests.length,
          pending: leaveRequests.filter(l => l.status === 'pending').length,
          approved: leaveRequests.filter(l => l.status === 'approved').length,
          rejected: leaveRequests.filter(l => l.status === 'rejected').length
        },
        notifications: {
          total: notifications.length,
          unread: notifications.filter(n => !n.isRead).length
        }
      };

      // Enhanced profile data
      const profileData = {
        ...userProfile,
        employeeProfile: userProfile?.employeeProfile || {},
        manager: userProfile?.manager,
        department: userProfile?.department_relation
      };

      // Filter requests with important comments
      const requestsWithComments = allRequests.filter(req => 
        req.approverComments || req.checkerComments || req.financeComments
      );

      await logApiAction(user.id, 'VIEW', 'employee_dashboard', undefined, { 
        targetEmployeeId: employeeId,
        period
      });

      return successResponse({
        profile: profileData,
        requests: {
          travel: travelRequests,
          valley: valleyRequests,
          all: allRequests,
          withComments: requestsWithComments
        },
        activities: {
          notifications: notifications.slice(0, 20),
          timeLogs: timeLogs.slice(0, 30),
          tasks: tasks.slice(0, 10),
          leaves: leaveRequests.slice(0, 10)
        },
        statistics: stats,
        meta: {
          period,
          periodRange: { startDate, endDate: now },
          includeHistory,
          recordCounts: {
            travel: travelRequests.length,
            valley: valleyRequests.length,
            notifications: notifications.length,
            timeLogs: timeLogs.length,
            tasks: tasks.length,
            leaves: leaveRequests.length
          }
        }
      });

    } catch (error) {
      console.error('Error in employee dashboard API:', error);
      return errorResponse('Failed to fetch dashboard data');
    }
  }
);