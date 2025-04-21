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
    
    console.log(`Fetching approver requests for approver ${approverId}`);
    console.log(`Filters: status=${status || 'all'}, phase=${phase || 'all'}`);
    
    // Base query to get requests assigned to this approver
    let query = supabase
      .from('travel_requests')
      .select('*')
      .eq('approver_id', approverId)
      .order('created_at', { ascending: false });
    
    // Add filters if provided
    if (status) {
      if (status === 'pending') {
        // For pending, only include truly pending requests
        query = query.eq('status', 'pending');
      } else if (status === 'completed') {
        // For completed, include all non-pending statuses
        query = query.not('status', 'eq', 'pending');
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
        // For pending, only include truly pending requests
        valleyQuery = valleyQuery.eq('status', 'pending');
      } else if (status === 'completed') {
        // For completed, include all non-pending statuses
        valleyQuery = valleyQuery.not('status', 'eq', 'pending');
      } else {
        valleyQuery = valleyQuery.eq('status', status);
      }
    }
    
    const { data: valleyRequests, error: valleyError } = await valleyQuery;
    
    // Log the status distribution to help debug
    if (travelRequests) {
      const travelStatusCounts = travelRequests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {});
      console.log('Travel requests by status:', travelStatusCounts);
    }
    
    if (valleyError) {
      console.error('Error fetching in-valley requests:', valleyError);
    }
    
    console.log(`Found ${travelRequests?.length || 0} travel requests and ${valleyRequests?.length || 0} in-valley requests for approver ${approverId}`);
    
    if (valleyRequests?.length === 0) {
      // Check if there are any in-valley requests in the system at all
      const { data: anyValleyRequests, error: checkError } = await supabase
        .from('valley_requests')
        .select('id, employee_id, approver_id, status')
        .limit(5);
      
      console.log('Sample of in-valley requests in system:', anyValleyRequests);
      
      if (checkError) {
        console.error('Error checking in-valley requests:', checkError);
      }
    }
    
    
    // Transform the data for consistent field naming
    const transformedTravelRequests = travelRequests ? travelRequests.map(req => ({
      ...req,
      employeeId: req.employee_id,
      employeeName: req.employee_name || 'Unknown',
      designation: req.designation,
      department: req.department,
      requestType: req.request_type,
      travelDateFrom: req.travel_date_from,
      travelDateTo: req.travel_date_to,
      totalAmount: req.total_amount,
      status: req.status,
      createdAt: req.created_at,
      updatedAt: req.updated_at
    })) : [];
    
    const transformedValleyRequests = valleyRequests ? valleyRequests.map(req => ({
      ...req,
      employeeId: req.employee_id,
      employeeName: req.employee_name || 'Unknown',
      designation: req.designation,
      department: req.department,
      requestType: 'in-valley',
      travelDateFrom: req.travel_date_from,
      travelDateTo: req.travel_date_to,
      expenseDate: req.expense_date,
      totalAmount: req.total_amount,
      status: req.status,
      createdAt: req.created_at,
      updatedAt: req.updated_at
    })) : [];
    
    // Combine the results
    const allRequests = [
      ...transformedTravelRequests,
      ...transformedValleyRequests
    ];
    
    console.log(`Returning ${allRequests.length} approver requests`);
    
    return NextResponse.json(allRequests);
  } catch (error) {
    console.error('Unexpected error in approver requests GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}