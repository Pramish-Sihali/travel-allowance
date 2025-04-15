// app/api/requests/[id]/route.ts - COMPLETELY FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { getTravelRequestById, updateTravelRequestStatus, createNotification } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  // Access id directly from context.params
  const id = context.params.id;
  
  try {
    const travelRequest = await getTravelRequestById(id);
    
    if (!travelRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(travelRequest);
  } catch (error) {
    console.error('Error fetching travel request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch travel request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Access id directly from context.params
    const id = context.params.id;
    
    // Log the ID to debug
    console.log('Request ID from params:', id);
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { status, comments, role } = body;
    
    // Validate required parameters
    if (!status || !role) {
      console.error('Missing required parameters:', { status, role });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const travelRequest = await getTravelRequestById(id);
    console.log('Found travel request:', travelRequest ? 'yes' : 'no');
    
    if (!travelRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      );
    }
    
    // Handle the updated workflow with checker role
    let newStatus = status;
    let notificationMessage = '';
    
    console.log('Processing request with role:', role, 'and status:', status);
    
    // If approver approves, change status to pending_verification
    if (role === 'approver' && status === 'approved') {
      newStatus = 'pending_verification';
      notificationMessage = `Your travel request has been approved by the approver and is pending financial verification`;
      console.log('Setting new status to pending_verification');
    } 
    // If checker approves a request that was approved by approver
    else if (role === 'checker' && status === 'approved' && travelRequest.status === 'pending_verification') {
      newStatus = 'approved';
      notificationMessage = `Your travel request has been fully approved and processed`;
      console.log('Setting new status to approved');
    }
    // If checker rejects 
    else if (role === 'checker' && status === 'rejected') {
      newStatus = 'rejected_by_checker';
      notificationMessage = `Your travel request has been rejected during financial verification`;
      console.log('Setting new status to rejected_by_checker');
    }
    // Handle regular approver rejection
    else if (role === 'approver' && status === 'rejected') {
      newStatus = 'rejected';
      notificationMessage = `Your travel request has been rejected`;
      console.log('Setting new status to rejected');
    }
    
    // Store appropriate comments based on role
    const updatedData: Record<string, any> = {}; 
    
    if (role === 'approver') {
      updatedData.approverComments = comments;
    } else if (role === 'checker') {
      updatedData.checkerComments = comments;
    }
    
    console.log('Calling updateTravelRequestStatus with:', { id, newStatus, updatedData });
    
    const updatedRequest = await updateTravelRequestStatus(id, newStatus, updatedData);
    
    if (!updatedRequest) {
      console.error('Failed to update travel request');
      return NextResponse.json(
        { error: 'Failed to update travel request status' },
        { status: 500 }
      );
    }
    
    console.log('Request updated successfully:', updatedRequest.status);
    
    // Create notification for the employee
    try {
      await createNotification({
        userId: updatedRequest.employeeId,
        requestId: updatedRequest.id,
        message: notificationMessage || `Your travel request has been ${status}`
      });
      
      // If request is now waiting for checker, notify checkers
      if (newStatus === 'pending_verification') {
        // In a real app, you would get checker IDs from the database
        try {
          await createNotification({
            userId: 'checker1', // This would be fetched from DB in a real app
            requestId: updatedRequest.id,
            message: `A new travel request is waiting for your financial verification`
          });
        } catch (checkerNotificationError) {
          console.log('Could not notify checker - this is expected in development');
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue even if notification fails
    }
    
    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating travel request:', error);
    return NextResponse.json(
      { error: 'Failed to update travel request' },
      { status: 400 }
    );
  }
}