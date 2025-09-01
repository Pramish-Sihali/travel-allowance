// lib/api-auth.ts
// Enhanced Role-Based Authentication for HR Management APIs

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/auth';

// Extended role hierarchy for HR management
export type ExtendedRole = 
  | 'EMPLOYEE' 
  | 'MANAGER' 
  | 'APPROVER' 
  | 'CHECKER' 
  | 'FINANCE' 
  | 'HR_ADMIN' 
  | 'ADMIN' 
  | 'SUPER_ADMIN';

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<ExtendedRole, number> = {
  EMPLOYEE: 1,
  MANAGER: 2,
  APPROVER: 3,
  CHECKER: 4,
  FINANCE: 5,
  HR_ADMIN: 6,
  ADMIN: 7,
  SUPER_ADMIN: 8
};

// Permission groups for different operations
export const PERMISSIONS = {
  // Employee permissions
  VIEW_OWN_DATA: ['EMPLOYEE', 'MANAGER', 'APPROVER', 'CHECKER', 'FINANCE', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  CREATE_OWN_REQUEST: ['EMPLOYEE', 'MANAGER', 'APPROVER', 'CHECKER', 'FINANCE', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  
  // Manager permissions
  VIEW_TEAM_DATA: ['MANAGER', 'APPROVER', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  APPROVE_TEAM_REQUESTS: ['MANAGER', 'APPROVER', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  
  // Approver permissions
  APPROVE_REQUESTS: ['APPROVER', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  VIEW_ALL_REQUESTS: ['APPROVER', 'CHECKER', 'FINANCE', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  
  // Finance permissions
  PROCESS_EXPENSES: ['FINANCE', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  VIEW_FINANCIAL_DATA: ['FINANCE', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  MANAGE_PAYROLL: ['FINANCE', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  
  // HR Admin permissions
  MANAGE_EMPLOYEES: ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  VIEW_ALL_DATA: ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  MANAGE_LEAVE_BALANCES: ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'],
  
  // Admin permissions
  MANAGE_ORGANIZATION: ['ADMIN', 'SUPER_ADMIN'],
  MANAGE_DEPARTMENTS: ['ADMIN', 'SUPER_ADMIN'],
  VIEW_ANALYTICS: ['ADMIN', 'SUPER_ADMIN'],
  
  // Super Admin permissions
  SYSTEM_ADMIN: ['SUPER_ADMIN']
} as const;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: ExtendedRole;
  organizationId: string;
  employeeId?: string;
  managerId?: string;
  department?: string;
  designation?: string;
}

// Main authentication function
export async function authenticate(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      return null;
    }

    // Get full user data from database
    const user = await prisma.user.findUnique({
      where: { 
        id: session.user.id,
        isActive: true 
      },
      include: {
        organization: true,
        employeeProfile: true
      }
    });

    if (!user || !user.organization) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as ExtendedRole,
      organizationId: user.organizationId,
      employeeId: user.employeeId || undefined,
      managerId: user.managerId || undefined,
      department: user.department || undefined,
      designation: user.designation || undefined
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Role-based authorization
export function hasPermission(userRole: ExtendedRole, requiredPermissions: readonly string[]): boolean {
  return requiredPermissions.includes(userRole);
}

// Check if user can access another user's data
export async function canAccessUserData(
  authenticatedUser: AuthenticatedUser, 
  targetUserId: string
): Promise<boolean> {
  // Users can always access their own data
  if (authenticatedUser.id === targetUserId) {
    return true;
  }

  // HR Admins and above can access all data
  if (hasPermission(authenticatedUser.role, PERMISSIONS.VIEW_ALL_DATA)) {
    return true;
  }

  // Managers can access their direct reports' data
  if (hasPermission(authenticatedUser.role, PERMISSIONS.VIEW_TEAM_DATA)) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { managerId: true, organizationId: true }
    });

    return targetUser?.managerId === authenticatedUser.id && 
           targetUser.organizationId === authenticatedUser.organizationId;
  }

  return false;
}

// API middleware for authentication and authorization
export function withAuth(handler: (
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: any }
) => Promise<NextResponse>) {
  return async (request: NextRequest, context: { params: any }) => {
    try {
      const user = await authenticate(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }

      return await handler(request, user, context);
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Middleware for role-based access control
export function withRoles(
  requiredPermissions: readonly string[],
  handler: (
    request: NextRequest,
    user: AuthenticatedUser,
    context: { params: any }
  ) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser, context: { params: any }) => {
    if (!hasPermission(user.role, requiredPermissions)) {
      return NextResponse.json(
        { 
          error: 'Forbidden - Insufficient permissions',
          required: requiredPermissions,
          current: user.role
        },
        { status: 403 }
      );
    }

    return await handler(request, user, context);
  });
}

// Middleware for organization-scoped operations
export function withOrgScope(
  requiredPermissions: readonly string[],
  handler: (
    request: NextRequest,
    user: AuthenticatedUser,
    context: { params: any }
  ) => Promise<NextResponse>
) {
  return withRoles(requiredPermissions, async (request: NextRequest, user: AuthenticatedUser, context: { params: any }) => {
    // Add organization filter to all queries
    request.nextUrl.searchParams.set('_orgId', user.organizationId);
    return await handler(request, user, context);
  });
}

// Utility function for error responses
export function errorResponse(message: string, status: number = 400, details?: any) {
  return NextResponse.json(
    { 
      success: false,
      error: message, 
      ...(details && { details }) 
    },
    { status }
  );
}

// Utility function for success responses
export function successResponse(data: any, status: number = 200, message?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status }
  );
}

// Data access utilities
export async function getOrganizationUsers(organizationId: string, includeInactive = false) {
  return await prisma.user.findMany({
    where: {
      organizationId,
      ...(includeInactive ? {} : { isActive: true })
    },
    include: {
      employeeProfile: true
    },
    orderBy: { name: 'asc' }
  });
}

export async function getUserTeam(managerId: string, organizationId: string) {
  return await prisma.user.findMany({
    where: {
      managerId,
      organizationId,
      isActive: true
    },
    include: {
      employeeProfile: true
    },
    orderBy: { name: 'asc' }
  });
}

// Request access control
export async function canAccessRequest(
  user: AuthenticatedUser,
  requestId: string,
  requestType: 'travel' | 'valley' = 'travel'
): Promise<boolean> {
  if (hasPermission(user.role, PERMISSIONS.VIEW_ALL_REQUESTS)) {
    return true;
  }

  const table = requestType === 'travel' ? 'travelRequest' : 'valleyRequest';
  const request = await (prisma as any)[table].findUnique({
    where: { id: requestId },
    select: { 
      employeeId: true, 
      approverId: true, 
      organizationId: true 
    }
  });

  if (!request || request.organizationId !== user.organizationId) {
    return false;
  }

  // Owner or approver can access
  return request.employeeId === user.id || 
         request.approverId === user.id ||
         await canAccessUserData(user, request.employeeId);
}

// Audit logging (for HR compliance)
export async function logApiAction(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: any
) {
  try {
    // This could be extended to write to an audit log table
    console.log('[AUDIT]', {
      userId,
      action,
      resource,
      resourceId,
      metadata,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}