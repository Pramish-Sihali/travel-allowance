import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized - No organization found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('employeeid', employeeId)
      .eq('organizationid', session.user.organizationId);

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
      employeeId: row.employeeid,
      employeeName: row.employeename,
      date: row.date,
      status: row.status,
      leaveType: row.leavetype,
      leaveReason: row.leavereason,
      approver: row.approver,
      isAdvancedLeave: row.isadvancedleave,
      createdAt: row.createdat,
      updatedAt: row.updatedat,
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized - No organization found' }, { status: 401 });
    }

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

    // Check if attendance already exists for this date in same organization
    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('employeeid', employeeId)
      .eq('date', date)
      .eq('organizationid', session.user.organizationId);

    if (existingAttendance && existingAttendance.length > 0) {
      // Update existing attendance
      const { error } = await supabaseAdmin
        .from('attendance')
        .update({
          status,
          leavetype: leaveType,
          leavereason: leaveReason,
          approver,
          isadvancedleave: isAdvancedLeave,
          updatedat: new Date().toISOString()
        })
        .eq('employeeid', employeeId)
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
      const { error } = await supabaseAdmin
        .from('attendance')
        .insert([{
          employeeid: employeeId,
          employeename: employeeName,
          status,
          date,
          leavetype: leaveType,
          leavereason: leaveReason,
          approver,
          isadvancedleave: isAdvancedLeave,
          organizationid: session.user.organizationId
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