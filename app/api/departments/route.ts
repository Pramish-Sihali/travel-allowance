// app/api/departments/route.ts
// Enhanced Departments API with Role-Based Access

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/departments - Get departments with employee counts and statistics
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const includeInactive = searchParams.get('includeInactive') === 'true';
      const includeStats = searchParams.get('includeStats') === 'true';
      const search = searchParams.get('search');

      let where: any = {
        organizationId: user.organizationId
      };

      if (!includeInactive) {
        where.isActive = true;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const departments = await dbHandler.prisma.department.findMany({
        where,
        include: includeStats ? {
          _count: {
            select: {
              users: { where: { isActive: true } },
              tasks: true
            }
          }
        } : undefined,
        orderBy: { name: 'asc' }
      });

      // Transform and add computed fields
      const transformedDepartments = departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        isActive: dept.isActive,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
        ...(includeStats && {
          employeeCount: dept._count?.users || 0,
          taskCount: dept._count?.tasks || 0
        })
      }));

      // Get summary statistics if requested
      let summary = null;
      if (includeStats) {
        const totalEmployees = await dbHandler.prisma.user.count({
          where: { 
            organizationId: user.organizationId,
            isActive: true
          }
        });

        const totalTasks = await dbHandler.prisma.task.count({
          where: { organizationId: user.organizationId }
        });

        summary = {
          totalDepartments: departments.length,
          activeDepartments: departments.filter(d => d.isActive).length,
          totalEmployees,
          totalTasks,
          averageEmployeesPerDepartment: departments.length > 0 ? 
            Math.round(totalEmployees / departments.filter(d => d.isActive).length) : 0
        };
      }

      await logApiAction(user.id, 'VIEW', 'departments', undefined, { 
        count: departments.length,
        includeStats
      });

      return successResponse({
        departments: transformedDepartments,
        ...(summary && { summary })
      });

    } catch (error) {
      console.error('Error fetching departments:', error);
      return errorResponse('Failed to fetch departments');
    }
  }
);

// POST /api/departments - Create new department (admin only)
export const POST = withAuth(
  async (request, user) => {
    try {
      // Only HR admins and above can create departments
      if (!['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied - Insufficient permissions', 403);
      }

      const body = await request.json();
      const { name, description } = body;

      if (!name || name.trim().length === 0) {
        return errorResponse('Department name is required', 400);
      }

      // Check if department with same name already exists
      const existingDepartment = await dbHandler.prisma.department.findFirst({
        where: {
          name: name.trim(),
          organizationId: user.organizationId
        }
      });

      if (existingDepartment) {
        return errorResponse('Department with this name already exists', 400);
      }

      const department = await dbHandler.prisma.department.create({
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          organizationId: user.organizationId,
          isActive: true
        }
      });

      await logApiAction(user.id, 'CREATE', 'department', department.id, {
        name: department.name
      });

      return successResponse(department, 201);

    } catch (error) {
      console.error('Error creating department:', error);
      return errorResponse('Failed to create department');
    }
  }
);

// PUT /api/departments - Update department (admin only)
export const PUT = withAuth(
  async (request, user) => {
    try {
      // Only HR admins and above can update departments
      if (!['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied - Insufficient permissions', 403);
      }

      const body = await request.json();
      const { id, name, description, isActive } = body;

      if (!id) {
        return errorResponse('Department ID is required', 400);
      }

      // Verify department exists and belongs to user's organization
      const existingDepartment = await dbHandler.prisma.department.findFirst({
        where: {
          id,
          organizationId: user.organizationId
        }
      });

      if (!existingDepartment) {
        return errorResponse('Department not found', 404);
      }

      // Check for name conflicts if name is being updated
      if (name && name.trim() !== existingDepartment.name) {
        const nameConflict = await dbHandler.prisma.department.findFirst({
          where: {
            name: name.trim(),
            organizationId: user.organizationId,
            id: { not: id }
          }
        });

        if (nameConflict) {
          return errorResponse('Department with this name already exists', 400);
        }
      }

      const updatedDepartment = await dbHandler.prisma.department.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(description !== undefined && { description: description?.trim() || '' }),
          ...(isActive !== undefined && { isActive })
        }
      });

      await logApiAction(user.id, 'UPDATE', 'department', id, {
        name: updatedDepartment.name,
        changes: { name: !!name, description: description !== undefined, isActive: isActive !== undefined }
      });

      return successResponse(updatedDepartment);

    } catch (error) {
      console.error('Error updating department:', error);
      return errorResponse('Failed to update department');
    }
  }
);