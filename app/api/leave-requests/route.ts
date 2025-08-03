import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const approverId = searchParams.get('approverId');

    let query = supabase
      .from('leave_requests')
      .select('*');

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (approverId) {
      query = query.eq('approver_id', approverId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leave requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leave requests' },
        { status: 500 }
      );
    }
    
    const leaveRequests = data.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      leaveType: row.leave_type,
      reason: row.reason,
      approverId: row.approver_id,
      approverName: row.approver_name,
      status: row.status,
      isAdvanced: row.is_advanced,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
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
      leaveType,
      reason,
      approverId,
      isAdvanced = false
    } = body;

    if (!employeeId || !employeeName || !leaveType || !reason || !approverId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get approver name
    const { data: approverData } = await supabase
      .from('users')
      .select('name')
      .eq('id', approverId)
      .single();

    const approverName = approverData?.name || 'Unknown';

    // Insert leave request
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([{
        employee_id: employeeId,
        employee_name: employeeName,
        leave_type: leaveType,
        reason,
        approver_id: approverId,
        approver_name: approverName,
        status: 'pending',
        is_advanced: isAdvanced
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating leave request:', error);
      return NextResponse.json(
        { error: 'Failed to create leave request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Leave request submitted successfully',
      id: data.id 
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('leave_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating leave request:', error);
      return NextResponse.json(
        { error: 'Failed to update leave request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Leave request updated successfully' });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to update leave request' },
      { status: 500 }
    );
  }
}