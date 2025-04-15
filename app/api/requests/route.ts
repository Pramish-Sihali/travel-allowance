import { NextRequest, NextResponse } from 'next/server';
import { createTravelRequest, getAllTravelRequests, getTravelRequestsByEmployeeId } from '@/lib/db';
import { TravelRequest } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const employeeId = searchParams.get('employeeId');
    
  try {
    let results;
    if (employeeId) {
      results = await getTravelRequestsByEmployeeId(employeeId);
    } else {
      results = await getAllTravelRequests();
    }
        
    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error('Error fetching travel requests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch travel requests: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
        
    // Ensure we have a valid UUID for employeeId
    const requestData = {
      ...body,
      employeeId: body.employeeId && body.employeeId.trim() !== '' ? body.employeeId : uuidv4()
    };
    
    console.log('Modified request data:', requestData);
        
    const newRequest = await createTravelRequest(requestData as Omit<TravelRequest, 'id' | 'createdAt' | 'updatedAt'>);
    console.log('Created request:', newRequest);
        
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating travel request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create travel request: ${errorMessage}` },
      { status: 400 }
    );
  }
}