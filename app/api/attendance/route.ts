import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId);

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }
    
    const attendance = data.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      date: row.date,
      status: row.status,
      leaveType: row.leave_type,
      leaveReason: row.leave_reason,
      approver: row.approver,
      isAdvancedLeave: row.is_advanced_leave,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!employeeId || !employeeName || !status || !date) {
      return NextResponse.json(
        { error: 'Employee ID, name, status, and date are required' },
        { status: 400 }
      );
    }

    // Check if attendance already exists for this date
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('date', date);

    if (existingAttendance && existingAttendance.length > 0) {
      // Update existing attendance
      const { error } = await supabase
        .from('attendance')
        .update({
          status,
          leave_type: leaveType,
          leave_reason: leaveReason,
          approver,
          is_advanced_leave: isAdvancedLeave,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .eq('date', date);

      if (error) {
        console.error('Error updating attendance:', error);
        return NextResponse.json(
          { error: 'Failed to update attendance' },
          { status: 500 }
        );
      }
    } else {
      // Create new attendance record
      const { error } = await supabase
        .from('attendance')
        .insert([{
          employee_id: employeeId,
          employee_name: employeeName,
          status,
          date,
          leave_type: leaveType,
          leave_reason: leaveReason,
          approver,
          is_advanced_leave: isAdvancedLeave
        }]);

      if (error) {
        console.error('Error inserting attendance:', error);
        return NextResponse.json(
          { error: 'Failed to record attendance' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    );
  }
}