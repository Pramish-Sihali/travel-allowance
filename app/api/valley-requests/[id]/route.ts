// app/api/valley-requests/[id]/route.ts - Fix for NextJS App Router params
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
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Fetching valley request details for ID: ${id}`);

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
      console.error(`Valley request with ID ${id} not found`);
      return NextResponse.json({ error: 'In-valley request not found' }, { status: 404 });
    }

    console.log(`Found valley request with status: ${data.status}`);

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
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== 'admin' && session.user.role !== 'approver' && session.user.role !== 'checker')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      console.error('Failed to fetch valley request:', fetchError);
      return NextResponse.json({ error: 'In-valley request not found' }, { status: 404 });
    }

    console.log(`Current valley request status: ${existingRequest.status}`);

    const employeeId = existingRequest.employee_id;
    let newStatus = status;
    let notificationMessage = '';
    let notifyCheckers = false;

    if (role === 'approver' && status === 'approved') {
      // Special handling for emergency and advance requests
      if (existingRequest.requestType === 'advance' || existingRequest.requestType === 'emergency') {
        // Set directly to pending_verification to appear in checker dashboard
        newStatus = 'pending_verification';
        notifyCheckers = true;
        
        if (existingRequest.requestType === 'emergency') {
          notificationMessage = `Your emergency in-valley request has been approved and sent to Finance for expedited processing.`;
        } else if (existingRequest.requestType === 'advance') {
          notificationMessage = `Your advance in-valley request has been approved and sent to Finance for advance payment processing.`;
        }
      } else {
        // For regular requests, set to travel_approved
        newStatus = 'travel_approved';
        notificationMessage = `Your in-valley reimbursement request has been approved. You can now submit your expenses.`;
      }
      console.log(`Approver approved request - setting status to '${newStatus}'`);
    } else if (
      role === 'checker' &&
      status === 'approved' &&
      existingRequest.status === 'pending_verification'
    ) {
      newStatus = 'approved';
      notificationMessage = `Your in-valley reimbursement request has been fully approved and processed`;
      console.log(`Checker approved request - setting status to 'approved'`);
    } else if (role === 'checker' && status === 'rejected') {
      newStatus = 'rejected_by_checker';
      notificationMessage = `Your in-valley reimbursement request has been rejected during financial verification`;
      console.log(`Checker rejected request - setting status to 'rejected_by_checker'`);
    } else if (role === 'approver' && status === 'rejected') {
      newStatus = 'rejected';
      notificationMessage = `Your in-valley reimbursement request has been rejected`;
      console.log(`Approver rejected request - setting status to 'rejected'`);
    } else {
      console.log(`No special status mapping for role=${role}, status=${status} - using status as-is`);
    }

    console.log(`Updating valley request status from ${existingRequest.status} to ${newStatus}`);

    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (role === 'approver') {
      updateData.approver_comments = comments;
      if (newStatus === 'travel_approved' || (newStatus === 'pending_verification' && 
          (existingRequest.requestType === 'advance' || existingRequest.requestType === 'emergency'))) {
        updateData.travel_details_approved_at = new Date().toISOString();
        
        // For advance requests, add flags
        if (existingRequest.requestType === 'advance') {
          updateData.needs_financial_attention = true;
        }
        
        // For emergency requests, add flags
        if (existingRequest.requestType === 'emergency') {
          updateData.needs_financial_attention = true;
          updateData.is_urgent = true;
        }
      }
    } else if (role === 'checker') {
      updateData.checker_comments = comments;
    }

    console.log('Updating request with data:', updateData);

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

    console.log(`Valley request updated successfully: previous status '${existingRequest.status}' → new status '${data.status}'`);

    try {
      console.log(`Creating notification for employee ${employeeId}`);

      await createNotification({
        userId: employeeId,
        requestId: id,
        message: notificationMessage || `Your in-valley reimbursement request has been ${status}`,
      });
      console.log('Employee notification created');

      // Notify checkers for both new pending_verification status or if explicitly requested
      if (newStatus === 'pending_verification' || notifyCheckers) {
        const { data: checkers, error: checkersError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'checker');
        if (!checkersError && checkers?.length) {
          console.log(`Notifying ${checkers.length} checkers about approved request`);
          for (const checker of checkers) {
            // Customize the notification message based on request type
            let checkerMessage = 'A new in-valley reimbursement request is waiting for your financial verification';
            
            if (existingRequest.requestType === 'advance' && (newStatus === 'pending_verification' || notifyCheckers)) {
              checkerMessage = 'An approved advance in-valley request requires your immediate attention for fund disbursement';
            } else if (existingRequest.requestType === 'emergency' && (newStatus === 'pending_verification' || notifyCheckers)) {
              checkerMessage = 'URGENT: An emergency in-valley request has been approved and requires your immediate attention';
            }
            
            await createNotification({
              userId: checker.id,
              requestId: id,
              message: checkerMessage,
            });
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