// lib/db.global.ts
// Universal Prisma Database Handler with Transformation Utilities

import { PrismaClient } from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library'

// Global Prisma instance with singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Type-safe database operations with automatic transformations
export class DatabaseHandler {
  public prisma = db

  // ======================
  // USER OPERATIONS
  // ======================
  
  async getUsers(filters: {
    organizationId?: string;
    isActive?: boolean;
    role?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20, search, ...whereFilters } = filters;
    
    const where: any = {
      ...whereFilters,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          employeeProfile: true,
          manager: { select: { id: true, name: true, employeeId: true } },
          subordinates: { 
            select: { id: true, name: true, employeeId: true },
            where: { isActive: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id: string, includeProfile = false) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        employeeProfile: includeProfile,
        manager: { select: { id: true, name: true, employeeId: true } },
        subordinates: { 
          select: { id: true, name: true, employeeId: true },
          where: { isActive: true }
        }
      }
    });
  }

  async createUser(data: any) {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          employeeId: data.employeeId,
          role: data.role || 'EMPLOYEE',
          department: data.department,
          designation: data.designation,
          managerId: data.managerId,
          organizationId: data.organizationId,
          joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
          password: data.password || 'temp123', // Hash in production
          isActive: true
        }
      });

      // Create employee profile if provided
      if (data.profile) {
        await tx.employeeProfile.create({
          data: {
            userId: user.id,
            organizationId: data.organizationId,
            ...data.profile
          }
        });
      }

      return user;
    });
  }

  async updateUser(id: string, data: any) {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.employeeId && { employeeId: data.employeeId }),
          ...(data.department && { department: data.department }),
          ...(data.designation && { designation: data.designation }),
          ...(data.managerId !== undefined && { managerId: data.managerId }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.joinDate && { joinDate: new Date(data.joinDate) }),
          ...(data.terminationDate && { terminationDate: new Date(data.terminationDate) })
        }
      });

      // Update profile if provided
      if (data.profile) {
        await tx.employeeProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            organizationId: data.organizationId,
            ...data.profile
          },
          update: data.profile
        });
      }

      return user;
    });
  }

  // ======================
  // TRAVEL REQUEST OPERATIONS
  // ======================

  async getTravelRequests(filters: {
    organizationId?: string;
    employeeId?: string;
    status?: string;
    requestType?: string;
    approverId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20, search, dateFrom, dateTo, ...whereFilters } = filters;
    
    const where: any = {
      ...whereFilters,
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) })
        }
      } : {}),
      ...(search && {
        OR: [
          { employeeName: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [requests, total] = await Promise.all([
      this.prisma.travelRequest.findMany({
        where,
        include: {
          employee: { select: { id: true, name: true, employeeId: true } },
          approver: { select: { id: true, name: true, employeeId: true } },
          expenseItems: true,
          notifications: {
            select: { id: true, message: true, isRead: true, createdAt: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.travelRequest.count({ where })
    ]);

    return {
      data: requests.map(this.transformTravelRequest),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getTravelRequestById(id: string) {
    const request = await this.prisma.travelRequest.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, employeeId: true } },
        approver: { select: { id: true, name: true, employeeId: true } },
        expenseItems: true,
        notifications: true
      }
    });

    return request ? this.transformTravelRequest(request) : null;
  }

  async createTravelRequest(data: any) {
    return await this.prisma.$transaction(async (tx) => {
      const request = await tx.travelRequest.create({
        data: {
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          department: data.department || '',
          designation: data.designation || '',
          organizationId: data.organizationId,
          requestType: data.requestType || 'NORMAL',
          project: data.project,
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
            userId: data.employeeId,
            organizationId: data.organizationId,
            requestId: request.id,
            message: `Your ${data.requestType || 'travel'} request has been submitted and is awaiting approval.`,
            requestType: 'travel'
          },
          {
            userId: data.approverId,
            organizationId: data.organizationId,
            requestId: request.id,
            message: `A new ${data.requestType || 'travel'} request from ${data.employeeName} is waiting for your approval.`,
            requestType: 'travel'
          }
        ]
      });

      return request;
    });
  }

  async updateTravelRequest(id: string, data: any) {
    return await this.prisma.travelRequest.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  // ======================
  // VALLEY REQUEST OPERATIONS
  // ======================

  async getValleyRequests(filters: any = {}) {
    const { page = 1, limit = 20, ...whereFilters } = filters;
    
    const [requests, total] = await Promise.all([
      this.prisma.valleyRequest.findMany({
        where: whereFilters,
        include: {
          employee: { select: { id: true, name: true, employeeId: true } },
          approver: { select: { id: true, name: true, employeeId: true } },
          valleyExpenses: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.valleyRequest.count({ where: whereFilters })
    ]);

    return {
      data: requests.map(this.transformValleyRequest),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async createValleyRequest(data: any) {
    return await this.prisma.valleyRequest.create({
      data: {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department || '',
        designation: data.designation || '',
        organizationId: data.organizationId,
        requestType: 'in-valley',
        project: data.project,
        purpose: data.purpose,
        expenseDate: data.expenseDate,
        location: data.location,
        description: data.description || '',
        paymentMethod: data.paymentMethod || '',
        meetingType: data.meetingType,
        meetingParticipants: data.meetingParticipants,
        totalAmount: data.totalAmount,
        status: 'pending',
        travelDateFrom: data.expenseDate,
        travelDateTo: data.expenseDate,
        approverId: data.approverId
      }
    });
  }

  // ======================
  // TASK OPERATIONS
  // ======================

  async getTasks(filters: any = {}) {
    const { page = 1, limit = 20, search, ...whereFilters } = filters;
    
    const where: any = {
      ...whereFilters,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, employeeId: true } },
          assignees: { select: { id: true, name: true, employeeId: true } },
          actionItems: {
            include: {
              assignee: { select: { id: true, name: true, employeeId: true } }
            },
            orderBy: { serialNo: 'asc' }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.task.count({ where })
    ]);

    return {
      data: tasks.map(this.transformTask),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async createTask(data: any) {
    return await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          departmentId: data.departmentId,
          departmentName: data.departmentName,
          assignedTo: data.assignedTo || [],
          assignedUserIds: data.assignedUserIds || [],
          status: data.status || 'NOT_STARTED',
          priority: data.priority || 'MEDIUM',
          ragStatus: data.ragStatus || 'UNRATED',
          dueDate: data.dueDate,
          startDate: data.startDate,
          bottlenecks: data.bottlenecks,
          ragTakeaway: data.ragTakeaway,
          remarks: data.remarks,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          organizationId: data.organizationId
        }
      });

      // Create action items if provided
      if (data.actionItems && data.actionItems.length > 0) {
        await tx.taskActionItem.createMany({
          data: data.actionItems.map((item: any, index: number) => ({
            taskId: task.id,
            organizationId: data.organizationId,
            serialNo: index + 1,
            title: item.title,
            description: item.description,
            assignedToId: item.assignedToId,
            assignedToName: item.assignedToName,
            priority: item.priority || 'MEDIUM',
            status: item.status || 'NOT_STARTED',
            dueDate: item.dueDate,
            remarks: item.remarks,
            createdBy: data.createdBy
          }))
        });
      }

      return task;
    });
  }

  // ======================
  // MEETING OPERATIONS
  // ======================

  async getMeetings(filters: any = {}) {
    const { page = 1, limit = 20, ...whereFilters } = filters;
    
    const [meetings, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where: whereFilters,
        include: {
          creator: { select: { id: true, name: true, employeeId: true } },
          assignee: { select: { id: true, name: true, employeeId: true } },
          client: { select: { id: true, name: true, company: true } },
          meetingMinutes: {
            include: {
              assignee: { select: { id: true, name: true, employeeId: true } }
            },
            orderBy: { serialNo: 'asc' }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { meetingDate: 'desc' }
      }),
      this.prisma.meeting.count({ where: whereFilters })
    ]);

    return {
      data: meetings.map(this.transformMeeting),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async createMeeting(data: any) {
    return await this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          title: data.title,
          description: data.description,
          meetingType: data.meetingType || 'internal',
          meetingDate: data.meetingDate,
          meetingTime: data.meetingTime || '10:00:00',
          durationMinutes: data.durationMinutes || 60,
          location: data.location,
          locationType: data.locationType || 'office',
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
          priority: data.priority || 'MEDIUM',
          status: 'scheduled',
          organizationId: data.organizationId
        }
      });

      // Create meeting minutes/action items
      if (data.meetingMinutes && data.meetingMinutes.length > 0) {
        await tx.meetingMinute.createMany({
          data: data.meetingMinutes.map((minute: any) => ({
            meetingId: meeting.id,
            organizationId: data.organizationId,
            serialNo: minute.serialNo || 1,
            responsibility: minute.responsibility,
            assignedToId: minute.assignedToId,
            assignedToName: minute.assignedToName,
            deadline: minute.deadline,
            remarks: minute.remarks,
            isDone: false
          }))
        });
      }

      return meeting;
    });
  }

  // ======================
  // NOTIFICATION OPERATIONS
  // ======================

  async getNotifications(filters: any = {}) {
    return await this.prisma.notification.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50
    });
  }

  async markNotificationAsRead(id: string) {
    return await this.prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllNotificationsAsRead(userId: string, organizationId: string) {
    return await this.prisma.notification.updateMany({
      where: { userId, organizationId, isRead: false },
      data: { isRead: true }
    });
  }

  // ======================
  // DEPARTMENT OPERATIONS
  // ======================

  async getDepartments(organizationId: string) {
    return await this.prisma.department.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  // ======================
  // PROJECT OPERATIONS
  // ======================

  async getProjects(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId, active: true },
      orderBy: { name: 'asc' }
    });

    return projects.map(project => ({
      value: project.id,
      label: project.name
    }));
  }

  // ======================
  // TRANSFORMATION HELPERS
  // ======================

  private transformTravelRequest = (request: any) => ({
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
    expenseItems: request.expenseItems || [],
    notifications: request.notifications || []
  });

  private transformValleyRequest = (request: any) => ({
    id: request.id,
    employeeId: request.employeeId,
    employeeName: request.employeeName,
    employee: request.employee,
    department: request.department,
    designation: request.designation,
    requestType: 'in-valley',
    project: request.project,
    purpose: request.purpose,
    expenseDate: request.expenseDate,
    location: request.location,
    description: request.description,
    paymentMethod: request.paymentMethod,
    meetingType: request.meetingType,
    meetingParticipants: request.meetingParticipants,
    totalAmount: Number(request.totalAmount),
    status: request.status,
    travelDateFrom: request.travelDateFrom,
    travelDateTo: request.travelDateTo,
    approverId: request.approverId,
    approver: request.approver,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    valleyExpenses: request.valleyExpenses || []
  });

  private transformTask = (task: any) => ({
    ...task,
    departmentName: task.department?.name || task.departmentName,
    actionItemsCount: task.actionItems?.length || 0,
    completedActionItems: task.actionItems?.filter((item: any) => item.status === 'COMPLETED').length || 0
  });

  private transformMeeting = (meeting: any) => ({
    ...meeting,
    actionItemsCount: meeting.meetingMinutes?.length || 0,
    completedActionItems: meeting.meetingMinutes?.filter((minute: any) => minute.isDone).length || 0
  });
}

// Export singleton instance
export const dbHandler = new DatabaseHandler();

// Backward compatibility exports
export {
  // User operations
  getUserByEmail,
  getUserById,
  getAllUsers,
  getUsersByRole,
  
  // Travel request operations
  getAllTravelRequests,
  getTravelRequestsByEmployeeId,
  getTravelRequestById,
  createTravelRequest,
  updateTravelRequestStatus,
  
  // Other operations
  getNotificationsByUserId,
  createNotification,
  markNotificationAsRead,
  getAllProjects,
  createProject
};

// Backward compatibility implementations
async function getUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email },
    include: { organization: true }
  });
}

async function getUserById(id: string) {
  return await dbHandler.getUserById(id, true);
}

async function getAllUsers() {
  const result = await dbHandler.getUsers({ limit: 1000 });
  return result.data;
}

async function getUsersByRole(role: string, organizationId?: string) {
  const result = await dbHandler.getUsers({ role, organizationId, limit: 1000 });
  return result.data;
}

async function getAllTravelRequests(organizationId?: string) {
  const result = await dbHandler.getTravelRequests({ organizationId, limit: 1000 });
  return result.data;
}

async function getTravelRequestsByEmployeeId(employeeId: string) {
  const result = await dbHandler.getTravelRequests({ employeeId, limit: 1000 });
  return result.data;
}

async function getTravelRequestById(id: string) {
  return await dbHandler.getTravelRequestById(id);
}

async function createTravelRequest(data: any) {
  return await dbHandler.createTravelRequest(data);
}

async function updateTravelRequestStatus(id: string, status: string, additionalData = {}) {
  return await dbHandler.updateTravelRequest(id, { status, ...additionalData });
}

async function getNotificationsByUserId(userId: string) {
  return await dbHandler.getNotifications({ userId });
}

async function createNotification(data: any) {
  return await db.notification.create({ data });
}

async function markNotificationAsRead(id: string) {
  return await dbHandler.markNotificationAsRead(id);
}

async function getAllProjects() {
  // This needs organizationId - will need to be updated in calling code
  return [];
}

async function createProject(name: string) {
  // This needs organizationId - will need to be updated in calling code
  return null;
}

export default db;