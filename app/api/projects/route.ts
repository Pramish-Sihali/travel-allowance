// app/api/projects/route.ts
// Enhanced Projects API with Role-Based Access

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/projects - Get projects with statistics and filtering
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

      const projects = await dbHandler.prisma.project.findMany({
        where,
        include: includeStats ? {
          _count: {
            select: {
              travelRequests: true,
              tasks: true
            }
          }
        } : undefined,
        orderBy: { name: 'asc' }
      });

      // Transform and add computed fields
      const transformedProjects = projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        isActive: project.isActive,
        budget: project.budget,
        startDate: project.startDate,
        endDate: project.endDate,
        projectManager: project.projectManager,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        ...(includeStats && {
          travelRequestCount: project._count?.travelRequests || 0,
          taskCount: project._count?.tasks || 0
        })
      }));

      // Get summary statistics if requested
      let summary = null;
      if (includeStats) {
        const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
        const activeProjects = projects.filter(p => p.isActive);
        
        summary = {
          totalProjects: projects.length,
          activeProjects: activeProjects.length,
          totalBudget,
          averageBudget: projects.length > 0 ? totalBudget / projects.length : 0,
          projectsByStatus: projects.reduce((acc, p) => {
            const status = p.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };
      }

      await logApiAction(user.id, 'VIEW', 'projects', undefined, { 
        count: projects.length,
        includeStats
      });

      return successResponse({
        projects: transformedProjects,
        ...(summary && { summary })
      });

    } catch (error) {
      console.error('Error fetching projects:', error);
      return errorResponse('Failed to fetch projects');
    }
  }
);

// POST /api/projects - Create new project (admin/manager only)
export const POST = withAuth(
  async (request, user) => {
    try {
      // Only managers and above can create projects
      if (!['MANAGER', 'APPROVER', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied - Insufficient permissions', 403);
      }

      const body = await request.json();
      const { 
        name, 
        description, 
        budget, 
        startDate, 
        endDate, 
        projectManager,
        status 
      } = body;

      if (!name || name.trim().length === 0) {
        return errorResponse('Project name is required', 400);
      }

      // Check if project with same name already exists
      const existingProject = await dbHandler.prisma.project.findFirst({
        where: {
          name: name.trim(),
          organizationId: user.organizationId
        }
      });

      if (existingProject) {
        return errorResponse('Project with this name already exists', 400);
      }

      // Validate project manager exists if provided
      if (projectManager) {
        const manager = await dbHandler.prisma.user.findFirst({
          where: {
            id: projectManager,
            organizationId: user.organizationId,
            role: { in: ['MANAGER', 'APPROVER', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'] }
          }
        });

        if (!manager) {
          return errorResponse('Invalid project manager', 400);
        }
      }

      const project = await dbHandler.prisma.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          budget: budget ? Number(budget) : null,
          startDate: startDate || null,
          endDate: endDate || null,
          projectManager: projectManager || null,
          status: status || 'PLANNING',
          organizationId: user.organizationId,
          isActive: true
        }
      });

      await logApiAction(user.id, 'CREATE', 'project', project.id, {
        name: project.name,
        budget: project.budget
      });

      return successResponse(project, 201);

    } catch (error) {
      console.error('Error creating project:', error);
      return errorResponse('Failed to create project');
    }
  }
);

// PUT /api/projects - Update project (admin/manager only)
export const PUT = withAuth(
  async (request, user) => {
    try {
      // Only managers and above can update projects
      if (!['MANAGER', 'APPROVER', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return errorResponse('Access denied - Insufficient permissions', 403);
      }

      const body = await request.json();
      const { 
        id, 
        name, 
        description, 
        budget, 
        startDate, 
        endDate, 
        projectManager,
        status,
        isActive 
      } = body;

      if (!id) {
        return errorResponse('Project ID is required', 400);
      }

      // Verify project exists and belongs to user's organization
      const existingProject = await dbHandler.prisma.project.findFirst({
        where: {
          id,
          organizationId: user.organizationId
        }
      });

      if (!existingProject) {
        return errorResponse('Project not found', 404);
      }

      // Check for name conflicts if name is being updated
      if (name && name.trim() !== existingProject.name) {
        const nameConflict = await dbHandler.prisma.project.findFirst({
          where: {
            name: name.trim(),
            organizationId: user.organizationId,
            id: { not: id }
          }
        });

        if (nameConflict) {
          return errorResponse('Project with this name already exists', 400);
        }
      }

      // Validate project manager if provided
      if (projectManager) {
        const manager = await dbHandler.prisma.user.findFirst({
          where: {
            id: projectManager,
            organizationId: user.organizationId,
            role: { in: ['MANAGER', 'APPROVER', 'HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'] }
          }
        });

        if (!manager) {
          return errorResponse('Invalid project manager', 400);
        }
      }

      const updatedProject = await dbHandler.prisma.project.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(description !== undefined && { description: description?.trim() || '' }),
          ...(budget !== undefined && { budget: budget ? Number(budget) : null }),
          ...(startDate !== undefined && { startDate }),
          ...(endDate !== undefined && { endDate }),
          ...(projectManager !== undefined && { projectManager }),
          ...(status && { status }),
          ...(isActive !== undefined && { isActive })
        }
      });

      await logApiAction(user.id, 'UPDATE', 'project', id, {
        name: updatedProject.name,
        changes: { 
          name: !!name, 
          description: description !== undefined,
          budget: budget !== undefined,
          projectManager: projectManager !== undefined,
          status: !!status,
          isActive: isActive !== undefined
        }
      });

      return successResponse(updatedProject);

    } catch (error) {
      console.error('Error updating project:', error);
      return errorResponse('Failed to update project');
    }
  }
);