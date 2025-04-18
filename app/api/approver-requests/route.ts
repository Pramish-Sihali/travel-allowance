import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET requests assigned to the current approver
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an approver
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'approver') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const approverId = session.user.id;
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const phase = searchParams.get('phase');
    
    // Base query to get requests assigned to this approver
    let query = supabase
      .from('travel_requests')
      .select('*')
      .eq('approver_id', approverId)
      .order('created_at', { ascending: false });
    
    // Add filters if provided
    if (status) {
      if (status === 'pending') {
        // For pending, include both pending and travel_approved statuses
        query = query.in('status', ['pending', 'travel_approved']);
      } else {
        query = query.eq('status', status);
      }
    }
    
    if (phase) {
      query = query.eq('phase', parseInt(phase));
    }
    
    const { data: travelRequests, error: travelError } = await query;
    
    if (travelError) {
      console.error('Error fetching travel requests:', travelError);
      return NextResponse.json(
        { error: 'Failed to fetch travel requests' },
        { status: 500 }
      );
    }
    
    // Get in-valley requests assigned to this approver
    let valleyQuery = supabase
      .from('valley_requests')
      .select('*')
      .eq('approver_id', approverId)
      .order('created_at', { ascending: false });
    
    // Add filters if provided
    if (status) {
      if (status === 'pending') {
        valleyQuery = valleyQuery.in('status', ['pending', 'travel_approved']);
      } else {
        valleyQuery = valleyQuery.eq('status', status);
      }
    }
    
    const { data: valleyRequests, error: valleyError } = await valleyQuery;
    
    // Combine the results
    const allRequests = [
      ...(travelRequests || []),
      ...(valleyRequests || [])
    ];
    
    return NextResponse.json(allRequests);
  } catch (error) {
    console.error('Unexpected error in approver requests GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}