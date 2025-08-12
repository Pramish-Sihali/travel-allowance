import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an approver
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'approver') {
      return NextResponse.json(
        { error: 'Access denied. Only approvers can access this endpoint.' },
        { status: 403 }
      );
    }

    const approverId = session.user.id;
    const organizationId = session.user.organizationId;

    // Fetch all requests assigned to this approver in parallel
    const [travelRequestsResponse, valleyRequestsResponse, usersResponse] = await Promise.all([
      supabaseAdmin
        .from('travel_requests')
        .select('*')
        .eq('approver_id', approverId)
        .eq('organizationid', organizationId)
        .order('created_at', { ascending: false }),
      
      supabaseAdmin
        .from('valley_requests')
        .select('*')
        .eq('approver_id', approverId)
        .eq('organizationid', organizationId)
        .order('created_at', { ascending: false }),
        
      supabaseAdmin
        .from('users')
        .select('id, name, email, department')
        .eq('organizationid', organizationId)
        .order('name', { ascending: true })
    ]);

    // Handle errors
    if (travelRequestsResponse.error) {
      console.error('Error fetching travel requests:', travelRequestsResponse.error);
      return NextResponse.json(
        { error: 'Failed to fetch travel requests' },
        { status: 500 }
      );
    }

    if (valleyRequestsResponse.error) {
      console.error('Error fetching valley requests:', valleyRequestsResponse.error);
      return NextResponse.json(
        { error: 'Failed to fetch valley requests' },
        { status: 500 }
      );
    }

    // Create user lookup map for employee details
    const usersMap = new Map();
    if (usersResponse.data) {
      usersResponse.data.forEach(user => {
        usersMap.set(user.id, {
          name: user.name,
          email: user.email,
          department: user.department
        });
      });
    }

    // Transform travel requests with employee details
    const travelRequests = (travelRequestsResponse.data || []).map((item: any) => {
      const employeeDetails = usersMap.get(item.employee_id) || {};
      
      return {
        id: item.id,
        employeeId: item.employee_id || '',
        employeeName: item.employee_name || employeeDetails.name || 'Unknown',
        employeeEmail: employeeDetails.email || '',
        department: item.department || employeeDetails.department || '',
        designation: item.designation || '',
        purpose: item.purpose || '',
        travelDateFrom: item.travel_date_from || new Date().toISOString(),
        travelDateTo: item.travel_date_to || new Date().toISOString(),
        totalAmount: item.total_amount || 0,
        status: item.status || 'pending',
        requestType: item.request_type || 'normal',
        previousOutstandingAdvance: item.previous_outstanding_advance || 0,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
        project: item.project || '',
        projectOther: item.project_other || '',
        purposeType: item.purpose_type || '',
        purposeOther: item.purpose_other || '',
        location: item.location || '',
        locationOther: item.location_other || '',
        transportMode: item.transport_mode || '',
        stationPickDrop: item.station_pick_drop || '',
        localConveyance: item.local_conveyance || '',
        rideShareUsed: item.ride_share_used || false,
        ownVehicleReimbursement: item.own_vehicle_reimbursement || false,
        approverComments: item.approver_comments,
        checkerComments: item.checker_comments,
        financeComments: item.finance_comments,
        phase: item.phase || 1,
        approverId: item.approver_id,
        travelDetailsApprovedAt: item.travel_details_approved_at,
        expensesSubmittedAt: item.expenses_submitted_at,
        isGroupTravel: item.is_group_travel || false,
        isGroupCaptain: item.is_group_captain || false,
        groupSize: item.group_size || '',
        groupMembers: item.group_members ? JSON.parse(item.group_members) : [],
        groupDescription: item.group_description || '',
        // Emergency fields
        emergencyReason: item.emergency_reason,
        emergencyReasonOther: item.emergency_reason_other,
        emergencyJustification: item.emergency_justification,
        emergencyAmount: item.emergency_amount,
        // Advance fields
        estimatedAmount: item.estimated_amount,
        advanceNotes: item.advance_notes,
      };
    });

    // Transform valley requests with employee details
    const valleyRequests = (valleyRequestsResponse.data || []).map((item: any) => {
      const employeeDetails = usersMap.get(item.employee_id) || {};
      
      return {
        id: item.id,
        employeeId: item.employee_id || '',
        employeeName: item.employee_name || employeeDetails.name || 'Unknown',
        employeeEmail: employeeDetails.email || '',
        department: item.department || employeeDetails.department || '',
        designation: item.designation || '',
        purpose: item.purpose || '',
        travelDateFrom: item.travel_date_from || item.expense_date || new Date().toISOString(),
        travelDateTo: item.travel_date_to || item.expense_date || new Date().toISOString(),
        expenseDate: item.expense_date || new Date().toISOString(),
        totalAmount: item.total_amount || 0,
        status: item.status || 'pending',
        requestType: 'in-valley',
        project: item.project || '',
        location: item.location || '',
        description: item.description || '',
        meetingType: item.meeting_type || '',
        meetingParticipants: item.meeting_participants || '',
        paymentMethod: item.payment_method || '',
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
        approverComments: item.approver_comments,
        checkerComments: item.checker_comments,
        financeComments: item.finance_comments,
        previousOutstandingAdvance: 0,
        phase: item.phase || 1,
        approverId: item.approver_id,
        travelDetailsApprovedAt: item.travel_details_approved_at,
        expensesSubmittedAt: item.expenses_submitted_at
      };
    });

    // Combine all requests
    const allRequests = [...travelRequests, ...valleyRequests];

    // Separate pending and completed requests
    const pendingRequests = allRequests.filter(req => req.status === 'pending');
    const completedRequests = allRequests.filter(req => 
      ['approved', 'rejected', 'rejected_by_checker', 'travel_approved', 'pending_verification'].includes(req.status)
    );

    // Calculate statistics
    const stats = {
      pendingCount: pendingRequests.length,
      approvedCount: allRequests.filter(req => req.status === 'approved').length,
      rejectedCount: allRequests.filter(req => ['rejected', 'rejected_by_checker'].includes(req.status)).length,
      inValleyCount: valleyRequests.length,
      totalAmount: allRequests
        .filter(req => req.status === 'approved' || req.status === 'pending_verification')
        .reduce((sum, req) => sum + (req.totalAmount || 0), 0)
    };

    return NextResponse.json({
      allRequests,
      pendingRequests,
      completedRequests,
      travelRequests,
      valleyRequests,
      stats,
      usersMap: Object.fromEntries(usersMap),
      totalRecords: {
        travel: travelRequests.length,
        valley: valleyRequests.length,
        pending: pendingRequests.length,
        completed: completedRequests.length
      }
    });

  } catch (error) {
    console.error('Error in approver dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}