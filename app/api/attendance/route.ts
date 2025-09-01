import { NextRequest } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  errorResponse,
  logApiAction
} from '@/lib/api-auth';
import { dbHandler } from '@/lib/db.global';

// GET /api/attendance - Fetch attendance records
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = request.nextUrl;
      const employeeId = searchParams.get('employeeId') || user.id;
      const date = searchParams.get('date');
      
      // Check if user can access the requested employee's data
      if (employeeId !== user.id && !['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user.role)) {
        return errorResponse('Access denied', 403);
      }

      const whereClause: any = {
        employeeId,
        organizationId: user.organizationId
      };

      if (date) {
        whereClause.date = date;
      }

      const attendance = await dbHandler.prisma.attendanceRecord.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            select: { id: true, name: true, employeeId: true }
          }
        }
      });

      await logApiAction(user.id, 'VIEW', 'attendance', undefined, { 
        targetEmployeeId: employeeId,
        date
      });

      return successResponse({
        attendance: attendance.map(record => ({
          id: record.id,
          employeeId: record.employeeId,
          employeeName: record.employee?.name,
          date: record.date,
          status: record.status,
          leaveType: record.leaveType,
          leaveReason: record.leaveReason,
          approver: record.approver,
          isAdvancedLeave: record.isAdvancedLeave,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        }))
      });

    } catch (error) {
      console.error('Error fetching attendance:', error);
      return errorResponse('Failed to fetch attendance');
    }
  }
);

// POST /api/attendance - Record attendance
export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const {
        employeeId,
        employeeName,
        status,
        date,
        leaveType,
        leaveReason,
        approver,
        isAdvancedLeave = false
      } = body;

      // Validate required fields
      if (!employeeId || !employeeName || !status || !date) {
        return errorResponse('Employee ID, name, status, and date are required', 400);
      }

      // Convert status to uppercase for enum compatibility
      const normalizedStatus = status.toUpperCase();

      // Check if user can record attendance for this employee
      if (employeeId !== user.id && !['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user.role)) {
        return errorResponse('Access denied', 403);
      }

      // Check if attendance already exists
      const existingAttendance = await dbHandler.prisma.attendanceRecord.findFirst({
        where: {
          employeeId,
          date,
          organizationId: user.organizationId
        }
      });

      if (existingAttendance) {
        // Update existing record
        await dbHandler.prisma.attendanceRecord.update({
          where: { id: existingAttendance.id },
          data: {
            status: normalizedStatus,
            leaveType,
            leaveReason,
            approver,
            isAdvancedLeave,
            updatedAt: new Date()
          }
        });

        await logApiAction(user.id, 'UPDATE', 'attendance', existingAttendance.id);
      } else {
        // Create new record
        await dbHandler.prisma.attendanceRecord.create({
          data: {
            employeeId,
            employeeName,
            status: normalizedStatus,
            date,
            leaveType,
            leaveReason,
            approver,
            isAdvancedLeave,
            organizationId: user.organizationId
          }
        });

        await logApiAction(user.id, 'CREATE', 'attendance');
      }

      return successResponse({ 
        message: existingAttendance ? 'Attendance updated successfully' : 'Attendance recorded successfully'
      });

    } catch (error) {
      console.error('Error recording attendance:', error);
      return errorResponse('Failed to record attendance');
    }
  }
);