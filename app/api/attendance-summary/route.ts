import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch all employees and their attendance for the specific date in a single query
    const { data: employees, error: employeesError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, department, designation')
      .order('name', { ascending: true });

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      );
    }

    // Fetch all attendance records for the specific date in a single query
    const { data: attendanceRecords, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('date', date);

    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      );
    }

    // Create a map for quick lookup
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.employee_id, {
        id: record.id,
        employeeId: record.employee_id,
        employeeName: record.employee_name,
        date: record.date,
        status: record.status,
        leaveType: record.leave_type,
        leaveReason: record.leave_reason,
        approver: record.approver,
        isAdvancedLeave: record.is_advanced_leave,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      });
    });

    // Build the response data for each employee
    const attendanceData = employees.map(employee => {
      const attendanceRecord = attendanceMap.get(employee.id) || null;
      
      // Determine status based on attendance and time
      let status: 'present' | 'late' | 'absent' | 'leave' = 'absent';
      let timestamp = undefined;

      if (attendanceRecord) {
        timestamp = attendanceRecord.createdAt;
        if (attendanceRecord.status === 'leave') {
          status = 'leave';
        } else if (attendanceRecord.status === 'present') {
          // Check if they were late (after 9:30 AM)
          const attendanceTime = new Date(attendanceRecord.createdAt);
          const cutoffTime = new Date(date);
          cutoffTime.setHours(9, 30, 0, 0); // 9:30 AM cutoff
          
          status = attendanceTime > cutoffTime ? 'late' : 'present';
        }
      }

      return {
        employee: {
          id: employee.id,
          name: employee.name || 'Unknown',
          email: employee.email,
          role: employee.role,
          department: employee.department || 'Unassigned',
          designation: employee.designation || 'Staff'
        },
        todayAttendance: attendanceRecord,
        status,
        timestamp
      };
    });

    return NextResponse.json({
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name || 'Unknown',
        email: emp.email,
        role: emp.role,
        department: emp.department || 'Unassigned',
        designation: emp.designation || 'Staff'
      })),
      attendanceData,
      date,
      totalEmployees: employees.length,
      totalRecords: attendanceRecords.length
    });

  } catch (error) {
    console.error('Error in attendance summary API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}