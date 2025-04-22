// app/api/valley-requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET a specific in-valley request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from('valley_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching in-valley request:', error);
      return NextResponse.json({ error: 'Failed to fetch in-valley request' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'In-valley request not found' }, { status: 404 });
    }

    if (
      session.user.role !== 'admin' &&
      session.user.role !== 'approver' &&
      session.user.role !== 'checker' &&
      data.employee_id !== session.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formattedData = {
      id: data.id,
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      department: data.department,
      designation: data.designation,
      requestType: data.request_type,
      project: data.project,
      purpose: data.purpose,
      expenseDate: data.expense_date,
      location: data.location,
      description: data.description,
      paymentMethod: data.payment_method,
      meetingType: data.meeting_type,
      meetingParticipants: data.meeting_participants,
      totalAmount: data.total_amount,
      status: data.status,
      approverComments: data.approver_comments,
      checkerComments: data.checker_comments,
      travelDateFrom: data.travel_date_from,
      travelDateTo: data.travel_date_to,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching in-valley request:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH (update) a specific in-valley request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== 'admin' && session.user.role !== 'approver' && session.user.role !== 'checker')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log('Request ID from params:', id);
    console.log('Request body:', body);

    const { status, comments, role } = body;
    if (!status || !role) {
      console.error('Missing required parameters:', { status, role });
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { data: existingRequest, error: fetchError } = await supabase
      .from('valley_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'In-valley request not found' }, { status: 404 });
    }

    const employeeId = existingRequest.employee_id;
    let newStatus = status;
    let notificationMessage = '';

    if (role === 'approver' && status === 'approved') {
      newStatus = 'travel_approved';
      notificationMessage = `Your in-valley reimbursement request has been approved. You can now submit your expenses.`;
    } else if (
      role === 'checker' &&
      status === 'approved' &&
      existingRequest.status === 'pending_verification'
    ) {
      newStatus = 'approved';
      notificationMessage = `Your in-valley reimbursement request has been fully approved and processed`;
    } else if (role === 'checker' && status === 'rejected') {
      newStatus = 'rejected_by_checker';
      notificationMessage = `Your in-valley reimbursement request has been rejected during financial verification`;
    } else if (role === 'approver' && status === 'rejected') {
      newStatus = 'rejected';
      notificationMessage = `Your in-valley reimbursement request has been rejected`;
    }

    console.log(`Updating valley request status from ${existingRequest.status} to ${newStatus}`);

    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (role === 'approver') {
      updateData.approver_comments = comments;
      if (newStatus === 'travel_approved') {
        updateData.travel_details_approved_at = new Date().toISOString();
      }
    } else if (role === 'checker') {
      updateData.checker_comments = comments;
    }

    const { data, error } = await supabase
      .from('valley_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating in-valley request:', error);
      return NextResponse.json({ error: 'Failed to update in-valley request' }, { status: 500 });
    }

    try {
      console.log(`Creating notification for employee ${employeeId}`);

      const notificationData = {
        id: uuidv4(),
        user_id: employeeId,
        request_id: id,
        message: notificationMessage || `Your in-valley reimbursement request has been ${status}`,
        read: false,
        created_at: new Date().toISOString()
      };
      await supabase.from('notifications').insert([notificationData]);

      if (newStatus === 'travel_approved') {
        const { data: checkers, error: checkersError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'checker');
        if (!checkersError && checkers?.length) {
          for (const checker of checkers) {
            await supabase.from('notifications').insert([{
              id: uuidv4(),
              user_id: checker.id,
              request_id: id,
              message: `A new in-valley reimbursement request is waiting for your financial verification`,
              read: false,
              created_at: new Date().toISOString()
            }]);
          }
        } else if (checkersError) {
          console.error('Error fetching checkers:', checkersError);
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    const formattedData = {
      id: data.id,
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      department: data.department,
      designation: data.designation,
      requestType: data.request_type,
      project: data.project,
      purpose: data.purpose,
      expenseDate: data.expense_date,
      location: data.location,
      description: data.description,
      paymentMethod: data.payment_method,
      meetingType: data.meeting_type,
      meetingParticipants: data.meeting_participants,
      totalAmount: data.total_amount,
      status: data.status,
      approverComments: data.approver_comments,
      checkerComments: data.checker_comments,
      travelDateFrom: data.travel_date_from,
      travelDateTo: data.travel_date_to,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    console.log('Request successfully updated to:', newStatus);
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error updating in-valley request:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE a specific in-valley request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Only admins can delete requests' }, { status: 401 });
    }

    console.log(`Attempting to delete in-valley request with ID: ${id}`);

    const { data: existingRequest, error: checkError } = await supabase
      .from('valley_requests')
      .select('id, employee_id, status')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking if in-valley request exists:', checkError);
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'In-valley request not found' }, { status: 404 });
      }
      throw checkError;
    }
    if (!existingRequest) {
      return NextResponse.json({ error: 'In-valley request not found' }, { status: 404 });
    }

    const { error: expenseError } = await supabase
      .from('valley_expenses')
      .delete()
      .eq('request_id', id);
    if (expenseError) {
      console.error('Error deleting valley expenses:', expenseError);
    }

    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('request_id', id);
    if (notificationError) {
      console.error('Error deleting notifications:', notificationError);
    }

    const { error: deleteError } = await supabase
      .from('valley_requests')
      .delete()
      .eq('id', id);
    if (deleteError) {
      console.error('Error deleting in-valley request:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true, message: 'In-valley request and associated data deleted successfully' });
  } catch (error) {
    console.error('Unexpected error deleting in-valley request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to delete in-valley request: ${errorMessage}` }, { status: 500 });
  }
}
