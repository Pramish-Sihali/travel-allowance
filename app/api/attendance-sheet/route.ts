import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an approver
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'approver') {
      return NextResponse.json(
        { error: 'Access denied. Only approvers can view attendance sheet.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM
    
    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all employees first
    const { data: employees, error: employeesError } = await supabase
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

    // Fetch all attendance records for the month in a single query
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      );
    }

    // Group attendance records by employee ID and date
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      const key = `${record.employee_id}_${record.date}`;
      attendanceMap.set(key, {
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

    // Generate all dates in the month
    const daysInMonth = endDate.getDate();
    const monthDates: Array<{
      date: string;
      dayName: string;
      dayNumber: number;
      isWeekend: boolean;
    }> = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      monthDates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    // Build the response data
    const attendanceData = employees.map(employee => {
      const attendanceRecords: { [date: string]: any } = {};
      
      monthDates.forEach(dateInfo => {
        const key = `${employee.id}_${dateInfo.date}`;
        attendanceRecords[dateInfo.date] = attendanceMap.get(key) || null;
      });

      return {
        employee: {
          id: employee.id,
          name: employee.name || 'Unknown',
          email: employee.email,
          role: employee.role,
          department: employee.department || 'Unassigned',
          designation: employee.designation || 'Staff'
        },
        attendanceRecords
      };
    });

    return NextResponse.json({
      employees: attendanceData,
      monthDates,
      month,
      totalEmployees: employees.length,
      totalRecords: attendanceRecords.length
    });

  } catch (error) {
    console.error('Error in attendance sheet API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}