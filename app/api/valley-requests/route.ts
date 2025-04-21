import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET all in-valley requests for a specific employee
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const employeeId = searchParams.get('employeeId');
    
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let query = supabase
      .from('valley_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    // If employeeId is provided, filter by it
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    } else if (session.user.role !== 'admin' && session.user.role !== 'approver' && session.user.role !== 'checker') {
      // If no employeeId is provided and user is not an admin, approver, or checker,
      // only return their own requests
      query = query.eq('employee_id', session.user.id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching in-valley requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch in-valley requests' },
        { status: 500 }
      );
    }
    
    // Convert snake_case to camelCase for frontend consistency
    const formattedData = data?.map(item => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: item.employee_name,
      department: item.department,
      designation: item.designation,
      requestType: item.request_type,
      project: item.project,
      purpose: item.purpose,
      expenseDate: item.expense_date,
      location: item.location,
      description: item.description,
      paymentMethod: item.payment_method,
      meetingType: item.meeting_type,
      meetingParticipants: item.meeting_participants,
      totalAmount: item.total_amount,
      status: item.status,
      approverComments: item.approver_comments,
      checkerComments: item.checker_comments,
      travelDateFrom: item.travel_date_from,
      travelDateTo: item.travel_date_to,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
        
    return NextResponse.json(formattedData);
  } catch (error: unknown) {
    console.error('Error fetching in-valley requests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch in-valley requests: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST a new in-valley request
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    console.log('In-valley request body:', body);
        
    // Ensure we have a valid UUID for employeeId
    const employeeId = (body.employeeId && body.employeeId.trim() !== '') 
      ? body.employeeId 
      : session.user.id || uuidv4();
    
    // Create the request data - convert camelCase to snake_case for the database
    const requestData = {
      id: uuidv4(),
      employee_id: employeeId,
      employee_name: body.employeeName,
      department: body.department,
      designation: body.designation,
      request_type: 'in-valley',
      project: body.project === 'other' ? body.projectOther : body.project,
      purpose: body.purposeType === 'other' ? body.purposeOther : body.purposeType,
      expense_date: body.expenseDate,
      location: body.location,
      description: body.description,
      payment_method: body.paymentMethod === 'other' ? body.paymentMethodOther : body.paymentMethod,
      meeting_type: body.meetingType || null,
      meeting_participants: body.meetingParticipants || null,
      total_amount: body.totalAmount || 0,
      status: 'pending',
      travel_date_from: body.expenseDate, // For compatibility with existing dashboard
      travel_date_to: body.expenseDate,   // For compatibility with existing dashboard
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      approver_id: body.approverId
    };
    
    console.log('Creating in-valley request:', requestData);
    
    // Insert the request into the database
    const { data, error } = await supabase
      .from('valley_requests')
      .insert([requestData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating in-valley request:', error);
      return NextResponse.json(
        { error: `Failed to create in-valley request: ${error.message}` },
        { status: 500 }
      );
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
    
    // Create notifications for the appropriate approvers
    try {
      // Get all users with approver role
      const { data: approvers, error: approversError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'approver');
      
      if (!approversError && approvers && approvers.length > 0) {
        // Create notifications for each approver
        for (const approver of approvers) {
          const approverNotification = {
            id: uuidv4(),
            user_id: approver.id,
            request_id: data.id,
            message: `A new in-valley reimbursement request is waiting for your approval`,
            read: false,
            created_at: new Date().toISOString()
          };
          
          await supabase
            .from('notifications')
            .insert([approverNotification]);
        }
      }
      
      // Create a notification for the employee
      const employeeNotification = {
        id: uuidv4(),
        user_id: employeeId,
        request_id: data.id,
        message: `Your in-valley reimbursement request has been submitted and is awaiting approval`,
        read: false,
        created_at: new Date().toISOString()
      };
      
      await supabase
        .from('notifications')
        .insert([employeeNotification]);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue despite notification error
    }
    
    return NextResponse.json(formattedData, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating in-valley request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create in-valley request: ${errorMessage}` },
      { status: 400 }
    );
  }
}