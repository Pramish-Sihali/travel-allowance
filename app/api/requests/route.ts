import { NextRequest, NextResponse } from 'next/server';
import { createTravelRequest, getAllTravelRequests, getTravelRequestsByEmployeeId } from '@/lib/db';
import { TravelRequest } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const employeeId = searchParams.get('employeeId');
    
  try {
    console.log(`GET /api/requests - employeeId: ${employeeId || 'all'}`);
    
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
    
    // Extract project information - if it's a UUID, get the project name
    let projectName = body.project;
    
    // Only attempt to fetch project name if it looks like a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(body.project)) {
      try {
        console.log('Fetching project name for UUID:', body.project);
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('name')
          .eq('id', body.project)
          .single();
          
        if (!projectError && projectData) {
          console.log('Found project name:', projectData.name);
          projectName = projectData.name;
        } else {
          console.log('Project not found or error:', projectError);
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      }
    } else if (body.project === 'other' && body.projectOther) {
      projectName = body.projectOther;
    }
    
    // Ensure we have a valid UUID for employeeId
    const requestData = {
      ...body,
      employeeId: body.employeeId && body.employeeId.trim() !== '' ? body.employeeId : uuidv4(),
      project: projectName, // Use the project name instead of UUID
      
      // Ensure emergency and advance request details are included
      emergencyReason: body.emergencyReason || null,
      emergencyReasonOther: body.emergencyReasonOther || null,
      emergencyJustification: body.emergencyJustification || null,
      emergencyAmount: body.emergencyAmount || null,
      estimatedAmount: body.estimatedAmount || null,
      advanceNotes: body.advanceNotes || null,
      
      // Include group travel info if applicable
      isGroupTravel: body.isGroupTravel || false,
      isGroupCaptain: body.isGroupCaptain || false,
      groupSize: body.groupSize || null,
      groupDescription: body.groupDescription || null,
      groupMembers: body.groupMembers || null
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