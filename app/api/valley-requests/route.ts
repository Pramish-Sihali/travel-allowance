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
      .order('createdAt', { ascending: false });
    
    // If employeeId is provided, filter by it
    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    } else if (session.user.role !== 'admin' && session.user.role !== 'approver' && session.user.role !== 'checker') {
      // If no employeeId is provided and user is not an admin, approver, or checker,
      // only return their own requests
      query = query.eq('employeeId', session.user.id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching in-valley requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch in-valley requests' },
        { status: 500 }
      );
    }
    
    // No transformation needed - database now uses camelCase!
        
    return NextResponse.json(data);
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
    
    // Create the request data - database now uses camelCase!
    const requestData = {
      id: uuidv4(),
      employeeId: employeeId,
      employeeName: body.employeeName,
      department: body.department,
      designation: body.designation,
      requestType: 'in-valley',
      project: body.project === 'other' ? body.projectOther : body.project,
      purpose: body.purposeType === 'other' ? body.purposeOther : body.purposeType,
      expenseDate: body.expenseDate,
      location: body.location,
      description: body.description,
      paymentMethod: body.paymentMethod === 'other' ? body.paymentMethodOther : body.paymentMethod,
      meetingType: body.meetingType || null,
      meetingParticipants: body.meetingParticipants || null,
      totalAmount: body.totalAmount || 0,
      status: 'pending',
      travelDateFrom: body.expenseDate,
      travelDateTo: body.expenseDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approverId: body.approverId
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
    
    // No transformation needed - database returns camelCase directly!
    
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
            userId: approver.id,
            requestId: data.id,
            message: `A new in-valley reimbursement request is waiting for your approval`,
            isRead: false,
            createdAt: new Date().toISOString()
          };
          
          await supabase
            .from('notifications')
            .insert([approverNotification]);
        }
      }
      
      // Create a notification for the employee
      const employeeNotification = {
        id: uuidv4(),
        userId: employeeId,
        requestId: data.id,
        message: `Your in-valley reimbursement request has been submitted and is awaiting approval`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      await supabase
        .from('notifications')
        .insert([employeeNotification]);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue despite notification error
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating in-valley request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create in-valley request: ${errorMessage}` },
      { status: 400 }
    );
  }
}