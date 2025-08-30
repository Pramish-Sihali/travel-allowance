// app/api/hr/dashboard/route.ts
// Comprehensive HR Dashboard API with Role-Based Access

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  PERMISSIONS, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/hr/dashboard - Get HR dashboard data based on user role
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const period = searchParams.get('period') || 'month'; // month, quarter, year
      const includeInactive = searchParams.get('includeInactive') === 'true';

      // Calculate date ranges
      const now = new Date();
      let startDate: Date;
      let endDate = now;

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

      // Base dashboard data that all roles can see
      let dashboardData: any = {
        period,
        periodRange: { startDate, endDate },
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          department: user.department
        }
      };

      // Role-based data fetching
      if (user.role === 'EMPLOYEE') {
        // Employee dashboard - personal data only
        const [myRequests, myTimeLogs, myTasks, myLeaves] = await Promise.all([
          // My travel requests
          prisma.travelRequest.findMany({
            where: {
              employeeId: user.id,
              organizationId: user.organizationId,
              createdAt: { gte: startDate }
            },
            select: {
              id: true,
              requestType: true,
              status: true,
              totalAmount: true,
              purpose: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          }),
          
          // My time logs
          prisma.timeLog.findMany({
            where: {
              userId: user.id,
              organizationId: user.organizationId,
              date: {
                gte: startDate.toISOString().split('T')[0],
                lte: endDate.toISOString().split('T')[0]
              }
            },
            select: {
              id: true,
              date: true,
              hoursSpent: true,
              taskType: true,
              description: true
            }
          }),

          // My tasks
          prisma.task.findMany({
            where: {
              OR: [
                { assignedUserIds: { has: user.id } },
                { createdBy: user.id }
              ],
              organizationId: user.organizationId
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }),

          // My leave requests
          prisma.leaveRequest.findMany({
            where: {
              employeeId: user.id,
              organizationId: user.organizationId,
              createdAt: { gte: startDate }
            },
            select: {
              id: true,
              leaveType: true,
              status: true,
              reason: true,
              createdAt: true
            }
          })
        ]);

        dashboardData.employee = {
          requests: {
            total: myRequests.length,
            pending: myRequests.filter(r => r.status === 'pending').length,
            approved: myRequests.filter(r => r.status === 'approved').length,
            rejected: myRequests.filter(r => ['rejected', 'rejected_by_checker'].includes(r.status)).length,
            totalAmount: myRequests.reduce((sum, r) => sum + Number(r.totalAmount), 0),
            recent: myRequests.slice(0, 5)
          },
          timeLogs: {
            totalHours: myTimeLogs.reduce((sum, log) => sum + Number(log.hoursSpent), 0),
            workingDays: new Set(myTimeLogs.map(log => log.date)).size,
            avgHoursPerDay: myTimeLogs.length > 0 ? 
              myTimeLogs.reduce((sum, log) => sum + Number(log.hoursSpent), 0) / 
              new Set(myTimeLogs.map(log => log.date)).size : 0,
            byTaskType: myTimeLogs.reduce((acc, log) => {
              acc[log.taskType] = (acc[log.taskType] || 0) + Number(log.hoursSpent);
              return acc;
            }, {} as Record<string, number>)
          },
          tasks: {
            total: myTasks.length,
            completed: myTasks.filter(t => t.status === 'COMPLETED').length,
            inProgress: myTasks.filter(t => t.status === 'IN_PROGRESS').length,
            overdue: myTasks.filter(t => 
              t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED'
            ).length,
            recent: myTasks.slice(0, 5)
          },
          leaves: {
            total: myLeaves.length,
            approved: myLeaves.filter(l => l.status === 'approved').length,
            pending: myLeaves.filter(l => l.status === 'pending').length,
            recent: myLeaves
          }
        };

      } else if (['MANAGER', 'APPROVER', 'CHECKER', 'FINANCE'].includes(user.role)) {
        // Manager/Approver dashboard - team data
        let teamMemberIds: string[] = [];
        
        if (user.role === 'MANAGER') {
          const teamMembers = await prisma.user.findMany({
            where: {
              managerId: user.id,
              organizationId: user.organizationId,
              ...(includeInactive ? {} : { isActive: true })
            },
            select: { id: true }
          });
          teamMemberIds = teamMembers.map(member => member.id);
        }

        const [pendingRequests, teamRequests, teamTasks, recentActivities] = await Promise.all([
          // Pending requests for approval
          prisma.travelRequest.findMany({
            where: {
              organizationId: user.organizationId,
              ...(user.role === 'MANAGER' ? 
                { employeeId: { in: teamMemberIds } } : 
                { approverId: user.id }
              ),
              status: 'pending'
            },
            include: {
              employee: {
                select: { id: true, name: true, employeeId: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          }),

          // Team travel requests
          user.role === 'MANAGER' ? prisma.travelRequest.findMany({
            where: {
              employeeId: { in: teamMemberIds },
              organizationId: user.organizationId,
              createdAt: { gte: startDate }
            },
            select: {
              id: true,
              status: true,
              totalAmount: true,
              employeeName: true,
              createdAt: true
            }
          }) : [],

          // Team tasks
          user.role === 'MANAGER' ? prisma.task.findMany({
            where: {
              OR: [
                { createdBy: user.id },
                { assignedUserIds: { hasSome: teamMemberIds } }
              ],
              organizationId: user.organizationId
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              ragStatus: true,
              assignedTo: true
            }
          }) : [],

          // Recent activities (notifications, updates, etc.)
          prisma.notification.findMany({
            where: {
              userId: user.id,
              organizationId: user.organizationId,
              createdAt: { gte: startDate }
            },
            select: {
              id: true,
              message: true,
              isRead: true,
              createdAt: true,
              requestType: true
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          })
        ]);

        dashboardData.approver = {
          pendingApprovals: {
            count: pendingRequests.length,
            urgent: pendingRequests.filter(r => r.isUrgent).length,
            totalValue: pendingRequests.reduce((sum, r) => sum + Number(r.totalAmount), 0),
            requests: pendingRequests.slice(0, 10)
          },
          ...(user.role === 'MANAGER' && {
            team: {
              size: teamMemberIds.length,
              requests: {
                total: teamRequests.length,
                approved: teamRequests.filter(r => r.status === 'approved').length,
                pending: teamRequests.filter(r => r.status === 'pending').length,
                totalSpent: teamRequests
                  .filter(r => r.status === 'approved')
                  .reduce((sum, r) => sum + Number(r.totalAmount), 0)
              },
              tasks: {
                total: teamTasks.length,
                completed: teamTasks.filter(t => t.status === 'COMPLETED').length,
                critical: teamTasks.filter(t => t.priority === 'CRITICAL').length,
                red: teamTasks.filter(t => t.ragStatus === 'RED').length
              }
            }
          }),
          activities: recentActivities
        };

      } else if (['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        // HR/Admin dashboard - organization-wide data
        const [
          employeeStats,
          requestStats,
          financialStats,
          taskStats,
          departmentStats,
          recentHires,
          leaveStats
        ] = await Promise.all([
          // Employee statistics
          prisma.user.groupBy({
            by: ['department', 'isActive'],
            where: { organizationId: user.organizationId },
            _count: { id: true }
          }),

          // Request statistics
          prisma.travelRequest.groupBy({
            by: ['status', 'requestType'],
            where: {
              organizationId: user.organizationId,
              createdAt: { gte: startDate }
            },
            _count: { id: true },
            _sum: { totalAmount: true }
          }),

          // Financial statistics
          prisma.travelRequest.aggregate({
            where: {
              organizationId: user.organizationId,
              status: 'approved',
              createdAt: { gte: startDate }
            },
            _sum: { totalAmount: true },
            _count: { id: true }
          }),

          // Task statistics
          prisma.task.groupBy({
            by: ['status', 'priority', 'ragStatus'],
            where: {
              organizationId: user.organizationId,
              createdAt: { gte: startDate }
            },
            _count: { id: true }
          }),

          // Department statistics
          prisma.department.findMany({
            where: { organizationId: user.organizationId },
            include: {
              _count: {
                select: {
                  tasks: true
                }
              }
            }
          }),

          // Recent hires
          prisma.user.findMany({
            where: {
              organizationId: user.organizationId,
              joinDate: { gte: startDate },
              isActive: true
            },
            select: {
              id: true,
              name: true,
              employeeId: true,
              department: true,
              joinDate: true
            },
            orderBy: { joinDate: 'desc' }
          }),

          // Leave statistics
          prisma.leaveRequest.groupBy({
            by: ['status', 'leaveType'],
            where: {
              organizationId: user.organizationId,
              createdAt: { gte: startDate }
            },
            _count: { id: true }
          })
        ]);

        dashboardData.admin = {
          employees: {
            total: employeeStats.reduce((sum, stat) => sum + stat._count.id, 0),
            active: employeeStats
              .filter(stat => stat.isActive)
              .reduce((sum, stat) => sum + stat._count.id, 0),
            byDepartment: employeeStats.reduce((acc, stat) => {
              const dept = stat.department || 'Unassigned';
              if (!acc[dept]) acc[dept] = { active: 0, total: 0 };
              acc[dept].total += stat._count.id;
              if (stat.isActive) acc[dept].active += stat._count.id;
              return acc;
            }, {} as Record<string, { active: number; total: number }>),
            recentHires: recentHires.length
          },
          requests: {
            total: requestStats.reduce((sum, stat) => sum + stat._count.id, 0),
            totalValue: requestStats.reduce((sum, stat) => sum + Number(stat._sum.totalAmount || 0), 0),
            byStatus: requestStats.reduce((acc, stat) => {
              acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
              return acc;
            }, {} as Record<string, number>),
            byType: requestStats.reduce((acc, stat) => {
              acc[stat.requestType] = (acc[stat.requestType] || 0) + stat._count.id;
              return acc;
            }, {} as Record<string, number>)
          },
          financial: {
            totalApproved: Number(financialStats._sum.totalAmount || 0),
            averageAmount: financialStats._count.id > 0 ? 
              Number(financialStats._sum.totalAmount || 0) / financialStats._count.id : 0,
            requestsApproved: financialStats._count.id
          },
          tasks: {
            total: taskStats.reduce((sum, stat) => sum + stat._count.id, 0),
            byStatus: taskStats.reduce((acc, stat) => {
              acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
              return acc;
            }, {} as Record<string, number>),
            byPriority: taskStats.reduce((acc, stat) => {
              acc[stat.priority] = (acc[stat.priority] || 0) + stat._count.id;
              return acc;
            }, {} as Record<string, number>),
            byRagStatus: taskStats.reduce((acc, stat) => {
              acc[stat.ragStatus] = (acc[stat.ragStatus] || 0) + stat._count.id;
              return acc;
            }, {} as Record<string, number>)
          },
          departments: departmentStats.map(dept => ({
            id: dept.id,
            name: dept.name,
            taskCount: dept._count.tasks,
            isActive: dept.isActive
          })),
          leaves: {
            total: leaveStats.reduce((sum, stat) => sum + stat._count.id, 0),
            byStatus: leaveStats.reduce((acc, stat) => {
              acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
              return acc;
            }, {} as Record<string, number>),
            byType: leaveStats.reduce((acc, stat) => {
              acc[stat.leaveType] = (acc[stat.leaveType] || 0) + stat._count.id;
              return acc;
            }, {} as Record<string, number>)
          },
          recentHires
        };
      }

      await logApiAction(user.id, 'VIEW', 'hr_dashboard', undefined, { 
        role: user.role,
        period 
      });

      return successResponse(dashboardData);

    } catch (error) {
      console.error('Error fetching HR dashboard:', error);
      return errorResponse('Failed to fetch dashboard data');
    }
  }
);