// app/api/requests/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTravelRequestById, updateTravelRequestStatus, createNotification } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: any }) {
  const { params } = context as { params: { id: string } };
  const id = params.id;
  
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

export async function PATCH(request: NextRequest, context: { params: any }) {
  const { params } = context as { params: { id: string } };
  try {
    const id = params.id;
    const body = await request.json();
    const { status } = body;
    
    const travelRequest = await getTravelRequestById(id);
    
    if (!travelRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      );
    }
    
    const updatedRequest = await updateTravelRequestStatus(id, status);
    
    // Create notification for the employee
    if (updatedRequest) {
      await createNotification({
        userId: updatedRequest.employeeId,
        requestId: updatedRequest.id,
        message: `Your travel request has been ${status}`
      });
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