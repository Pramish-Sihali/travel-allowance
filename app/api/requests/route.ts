// app/api/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createTravelRequest, getAllTravelRequests, getTravelRequestsByEmployeeId } from '@/lib/db';
import { TravelRequest } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const employeeId = searchParams.get('employeeId');
  
  let results;
  if (employeeId) {
    results = getTravelRequestsByEmployeeId(employeeId);
  } else {
    results = getAllTravelRequests();
  }
  
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a real app, validate the body data here
    
    const newRequest = createTravelRequest(body as Omit<TravelRequest, 'id' | 'createdAt' | 'updatedAt'>);
    
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating travel request:', error);
    return NextResponse.json(
      { error: 'Failed to create travel request' },
      { status: 400 }
    );
  }
}