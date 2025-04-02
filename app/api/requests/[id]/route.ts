// app/api/requests/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTravelRequestById, updateTravelRequestStatus, createNotification } from '@/lib/db';

interface ContextParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  context: ContextParams
) {
  const id = context.params.id;
  const travelRequest = getTravelRequestById(id);
  
  if (!travelRequest) {
    return NextResponse.json(
      { error: 'Travel request not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(travelRequest);
}

export async function PATCH(
  request: NextRequest,
  context: ContextParams
) {
  try {
    const id = context.params.id;
    const body = await request.json();
    const { status } = body;
    
    const travelRequest = getTravelRequestById(id);
    
    if (!travelRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      );
    }
    
    const updatedRequest = updateTravelRequestStatus(id, status);
    
    // Create notification for the employee
    if (updatedRequest) {
      createNotification({
        userId: updatedRequest.employeeId,
        requestId: updatedRequest.id,
        message: `Your travel request has been ${status}`,
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