import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || session.user.id;
    const organizationId = session.user.organizationId;

    // Fetch travel requests and in-valley requests in parallel
    const [travelResponse, valleyResponse, notificationsResponse] = await Promise.all([
      supabaseAdmin
        .from('travel_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('organizationid', organizationId)
        .order('created_at', { ascending: false }),
      
      supabaseAdmin
        .from('valley_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('organizationid', organizationId)
        .order('created_at', { ascending: false }),
        
      supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', employeeId)
        .eq('organizationid', organizationId)
        .order('created_at', { ascending: false })
        .limit(50) // Limit to latest 50 notifications
    ]);

    // Handle errors
    if (travelResponse.error) {
      console.error('Error fetching travel requests:', travelResponse.error);
    }
    if (valleyResponse.error) {
      console.error('Error fetching valley requests:', valleyResponse.error);
    }
    if (notificationsResponse.error) {
      console.error('Error fetching notifications:', notificationsResponse.error);
    }

    // Transform travel requests
    const travelRequests = (travelResponse.data || []).map((item: any) => ({
      id: item.id,
      employeeId: item.employee_id || '',
      employeeName: item.employee_name || 'Unknown',
      department: item.department || '',
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
    }));

    // Transform valley requests
    const valleyRequests = (valleyResponse.data || []).map((item: any) => ({
      id: item.id,
      employeeId: item.employee_id || '',
      employeeName: item.employee_name || 'Unknown',
      department: item.department || '',
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
    }));

    // Transform notifications
    const notifications = (notificationsResponse.data || []).map((notification: any) => ({
      id: notification.id,
      userId: notification.user_id,
      requestId: notification.request_id,
      message: notification.message,
      read: notification.read,
      createdAt: notification.created_at
    }));

    // Calculate statistics
    const allRequests = [...travelRequests, ...valleyRequests];
    const stats = {
      pending: allRequests.filter(req => req.status === 'pending').length,
      approved: allRequests.filter(req => req.status === 'approved').length,
      rejected: allRequests.filter(req => ['rejected', 'rejected_by_checker'].includes(req.status)).length,
      totalAmount: allRequests.reduce((total, req) => total + (req.totalAmount || 0), 0),
      travelCount: travelRequests.length,
      inValleyCount: valleyRequests.length,
      waitingForExpenses: allRequests.filter(req => req.status === 'travel_approved').length
    };

    // Filter finance comments requests
    const requestsWithComments = allRequests.filter(req => 
      (req.requestType === 'emergency' || req.requestType === 'advance') &&
      ((req.financeComments && req.financeComments.trim() !== '') || 
       (req.checkerComments && req.checkerComments.trim() !== ''))
    );

    return NextResponse.json({
      travelRequests,
      valleyRequests,
      allRequests,
      notifications,
      stats,
      requestsWithComments,
      hasFinanceComments: requestsWithComments.length > 0,
      totalRecords: {
        travel: travelRequests.length,
        valley: valleyRequests.length,
        notifications: notifications.length
      }
    });

  } catch (error) {
    console.error('Error in employee dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}