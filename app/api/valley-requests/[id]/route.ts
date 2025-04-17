import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET a specific in-valley request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('valley_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching in-valley request:', error);
      return NextResponse.json(
        { error: 'Failed to fetch in-valley request' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'In-valley request not found' },
        { status: 404 }
      );
    }
    
    // If user is not an admin, approver, or checker, and not the owner of the request,
    // deny access
    if (
      session.user.role !== 'admin' && 
      session.user.role !== 'approver' && 
      session.user.role !== 'checker' && 
      data.employee_id !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Convert snake_case to camelCase for frontend consistency
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
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific in-valley request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and has appropriate role
    const session = await getServerSession(authOptions);
    if (
      !session?.user || 
      (session.user.role !== 'admin' && session.user.role !== 'approver' && session.user.role !== 'checker')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    console.log('Request ID from params:', id);
    console.log('Request body:', body);
    
    const { status, comments, role } = body;
    if (!status || !role) {
      console.error('Missing required parameters:', { status, role });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the current state of the request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('valley_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'In-valley request not found' },
        { status: 404 }
      );
    }
    
    // Determine new status based on current role and requested status
    let newStatus = status;
    let notificationMessage = '';
    
    if (role === 'approver' && status === 'approved') {
      newStatus = 'pending_verification';
      notificationMessage = `Your in-valley reimbursement request has been approved by the approver and is pending financial verification`;
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
    
    // Prepare update data - using snake_case for database
    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (role === 'approver') {
      updateData.approver_comments = comments;
    } else if (role === 'checker') {
      updateData.checker_comments = comments;
    }
    
    // Update the request in the database
    const { data, error } = await supabase
      .from('valley_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating in-valley request:', error);
      return NextResponse.json(
        { error: 'Failed to update in-valley request' },
        { status: 500 }
      );
    }
    
    // Create notification using the existing notification system
    try {
      // Insert notification into the database
      const notificationData = {
        id: uuidv4(),
        user_id: data.employee_id,
        request_id: data.id,
        message: notificationMessage || `Your in-valley reimbursement request has been ${status}`,
        read: false,
        created_at: new Date().toISOString()
      };
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([notificationData]);
      
      if (notificationError) {
        console.error('Error creating notification in database:', notificationError);
      }
      
      // Notify checkers if the request was approved by an approver
      if (newStatus === 'pending_verification') {
        // Get all users with checker role
        const { data: checkers, error: checkersError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'checker');
        
        if (!checkersError && checkers) {
          // Create notifications for each checker
          for (const checker of checkers) {
            const checkerNotification = {
              id: uuidv4(),
              user_id: checker.id,
              request_id: data.id,
              message: `A new in-valley reimbursement request is waiting for your financial verification`,
              read: false,
              created_at: new Date().toISOString()
            };
            
            await supabase
              .from('notifications')
              .insert([checkerNotification]);
          }
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue despite notification error
    }
    
    // Convert snake_case back to camelCase for frontend consistency
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
    console.error('Error updating in-valley request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}