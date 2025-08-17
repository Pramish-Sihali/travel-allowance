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
      .order('createdat', { ascending: false });
    
    // If employeeId is provided, filter by it
    if (employeeId) {
      query = query.eq('employeeid', employeeId);
    } else if (session.user.role !== 'admin' && session.user.role !== 'approver' && session.user.role !== 'checker') {
      // If no employeeId is provided and user is not an admin, approver, or checker,
      // only return their own requests
      query = query.eq('employeeid', session.user.id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching in-valley requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch in-valley requests' },
        { status: 500 }
      );
    }
    
    // Transform database snake_case to camelCase
    const transformedData = data.map(request => ({
      id: request.id,
      employeeId: request.employeeid,
      employeeName: request.employeename,
      department: request.department,
      designation: request.designation,
      requestType: request.requesttype,
      project: request.project,
      purpose: request.purpose,
      expenseDate: request.expensedate,
      location: request.location,
      description: request.description,
      paymentMethod: request.paymentmethod,
      meetingType: request.meetingtype,
      meetingParticipants: request.meetingparticipants,
      totalAmount: request.totalamount,
      status: request.status,
      approverComments: request.approvercomments,
      checkerComments: request.checkercomments,
      financeComments: request.financecomments,
      travelDateFrom: request.traveldatefrom,
      travelDateTo: request.traveldateto,
      createdAt: request.createdat,
      updatedAt: request.updatedat,
      phase: request.phase,
      travelDetailsApprovedAt: request.traveldetailsapprovedat,
      expensesSubmittedAt: request.expensessubmittedat,
      approverId: request.approverid,
      emergencyReason: request.emergencyreason,
      emergencyReasonOther: request.emergencyreasonother,
      emergencyJustification: request.emergencyjustification,
      emergencyAmount: request.emergencyamount,
      needsFinancialAttention: request.needsfinancialattention,
      isUrgent: request.isurgent,
      organizationId: request.organizationid
    }));
        
    return NextResponse.json(transformedData);
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
    
    // Transform camelCase fields to database snake_case fields
    const requestData = {
      id: uuidv4(),
      employeeid: employeeId,
      employeename: body.employeeName,
      department: body.department,
      designation: body.designation,
      requesttype: 'in-valley',
      project: body.project === 'other' ? body.projectOther : body.project,
      purpose: body.purposeType === 'other' ? body.purposeOther : body.purposeType,
      expensedate: body.expenseDate,
      location: body.location,
      description: body.description,
      paymentmethod: body.paymentMethod === 'other' ? body.paymentMethodOther : body.paymentMethod,
      meetingtype: body.meetingType || null,
      meetingparticipants: body.meetingParticipants || null,
      totalamount: body.totalAmount || 0,
      status: 'pending',
      traveldatefrom: body.expenseDate,
      traveldateto: body.expenseDate,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
      approverid: body.approverId,
      organizationid: session.user.organizationId
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
    
    // Transform database response back to camelCase
    const transformedData = {
      id: data.id,
      employeeId: data.employeeid,
      employeeName: data.employeename,
      department: data.department,
      designation: data.designation,
      requestType: data.requesttype,
      project: data.project,
      purpose: data.purpose,
      expenseDate: data.expensedate,
      location: data.location,
      description: data.description,
      paymentMethod: data.paymentmethod,
      meetingType: data.meetingtype,
      meetingParticipants: data.meetingparticipants,
      totalAmount: data.totalamount,
      status: data.status,
      travelDateFrom: data.traveldatefrom,
      travelDateTo: data.traveldateto,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
      approverId: data.approverid,
      organizationId: data.organizationid
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
            userid: approver.id,
            requestid: data.id,
            message: `A new in-valley reimbursement request is waiting for your approval`,
            isread: false,
            createdat: new Date().toISOString()
          };
          
          await supabase
            .from('notifications')
            .insert([approverNotification]);
        }
      }
      
      // Create a notification for the employee
      const employeeNotification = {
        id: uuidv4(),
        userid: employeeId,
        requestid: data.id,
        message: `Your in-valley reimbursement request has been submitted and is awaiting approval`,
        isread: false,
        createdat: new Date().toISOString()
      };
      
      await supabase
        .from('notifications')
        .insert([employeeNotification]);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue despite notification error
    }
    
    return NextResponse.json(transformedData, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating in-valley request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create in-valley request: ${errorMessage}` },
      { status: 400 }
    );
  }
}