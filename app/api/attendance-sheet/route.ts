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

    // Allow approvers and other roles to view attendance sheet  
    // Removed role restriction to allow broader access

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Can be single date or month format
    const month = searchParams.get('month'); // Format: YYYY-MM
    
    let startDate: Date, endDate: Date, year: number, monthNum: number;
    
    if (month) {
      // Month-based query
      [year, monthNum] = month.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0); // Last day of month
    } else if (date) {
      // Single date query - get the whole month for that date
      const queryDate = new Date(date);
      year = queryDate.getFullYear();
      monthNum = queryDate.getMonth() + 1;
      startDate = new Date(year, queryDate.getMonth(), 1);
      endDate = new Date(year, queryDate.getMonth() + 1, 0); // Last day of month
    } else {
      return NextResponse.json(
        { error: 'Either date or month parameter is required' },
        { status: 400 }
      );
    }
    
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

    // Build the response data for single date or month view
    const targetDate = date || `${year}-${monthNum.toString().padStart(2, '0')}-01`;
    
    const attendanceData = employees.map(employee => {
      // For single date view, get attendance for the specific date
      const key = `${employee.id}_${date || targetDate}`;
      const todayAttendance = attendanceMap.get(key) || null;
      
      // Determine status based on attendance and time
      let status: 'present' | 'late' | 'absent' | 'leave' = 'absent';
      let timestamp = undefined;

      if (todayAttendance) {
        timestamp = todayAttendance.createdAt;
        if (todayAttendance.status === 'leave') {
          status = 'leave';
        } else if (todayAttendance.status === 'present') {
          // Check if they were late (after 9:30 AM)
          const attendanceTime = new Date(todayAttendance.createdAt);
          const cutoffTime = new Date(date || targetDate);
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
        todayAttendance,
        status,
        timestamp
      };
    });

    // For month view, also include the full month data
    const monthData = month ? employees.map(employee => {
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
    }) : null;

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
      monthData, // For month view if needed
      monthDates: month ? monthDates : null,
      month: month || `${year}-${monthNum.toString().padStart(2, '0')}`,
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