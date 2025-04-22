// app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getTravelRequestById,
  updateTravelRequestStatus,
  createNotification,
} from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const travelRequest = await getTravelRequestById(id)
    if (!travelRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(travelRequest)
  } catch (error) {
    console.error('Error fetching travel request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch travel request' },
      { status: 500 }
    )
  }
}




// Update PATCH method in app/api/requests/[id]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    console.log('Request ID from params:', id);
    const body = await request.json();
    console.log('Request body:', body);

    const { status, comments, role } = body;
    if (!status || !role) {
      console.error('Missing required parameters:', { status, role });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const travelRequest = await getTravelRequestById(id);
    if (!travelRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      );
    }

    // Store the employee ID for notification
    const employeeId = travelRequest.employeeId;
    
    let newStatus = status;
    let notificationMessage = '';

    // Updated status flow to support two-phase workflow
    if (role === 'approver' && status === 'approved') {
      // Phase 1 approval - travel details approved, waiting for expense submission
      newStatus = 'travel_approved';
      notificationMessage = `Your travel request has been approved. You can now submit your expenses after your travel is complete.`;
    } else if (
      role === 'checker' &&
      status === 'approved' &&
      travelRequest.status === 'pending_verification'
    ) {
      // Phase 2 approval - expenses verified and approved
      newStatus = 'approved';
      notificationMessage = `Your travel request and expenses have been fully approved and processed`;
    } else if (role === 'checker' && status === 'rejected') {
      newStatus = 'rejected_by_checker';
      notificationMessage = `Your travel expenses have been rejected during financial verification`;
    } else if (role === 'approver' && status === 'rejected') {
      newStatus = 'rejected';
      notificationMessage = `Your travel request has been rejected`;
    }

    console.log(`Updating request status from ${travelRequest.status} to ${newStatus}`);

    const updatedData: Record<string, any> = {
      status: newStatus
    };
    
    if (role === 'approver') {
      updatedData.approverComments = comments;
      
      // For Phase 1 approval, set the approval timestamp
      if (newStatus === 'travel_approved') {
        updatedData.travel_details_approved_at = new Date().toISOString();
      }
    } else if (role === 'checker') {
      updatedData.checkerComments = comments;
    }

    const updatedRequest = await updateTravelRequestStatus(
      id,
      newStatus as any, // Type coercion to satisfy the type system
      updatedData
    );
    
    if (!updatedRequest) {
      console.error('Failed to update travel request');
      return NextResponse.json(
        { error: 'Failed to update travel request status' },
        { status: 500 }
      );
    }

    // Notify employee - ensure this doesn't fail
    try {
      console.log(`Creating notification for employee ${employeeId}`);
      
      await createNotification({
        userId: employeeId,
        requestId: id,
        message: notificationMessage || `Your travel request has been ${status}`,
      });
      
      console.log('Employee notification created successfully');
      
      // Also notify checkers if this is moving to verification
      if (newStatus === 'pending_verification') {
        // Get all users with checker role from Supabase
        const { data: checkers, error: checkersError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'checker');
          
        if (!checkersError && checkers && checkers.length > 0) {
          console.log(`Notifying ${checkers.length} checkers`);
          
          for (const checker of checkers) {
            await createNotification({
              userId: checker.id,
              requestId: id,
              message: `A new travel request is waiting for your financial verification`,
            });
          }
        } else if (checkersError) {
          console.error('Error fetching checkers:', checkersError);
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue despite notification error - don't fail the request
    }

    console.log('Request successfully updated to:', newStatus);
    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating travel request:', error);
    return NextResponse.json(
      { error: 'Failed to update travel request' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can delete requests' },
        { status: 401 }
      );
    }

    const id = params.id;
    console.log(`Attempting to delete travel request with ID: ${id}`);

    // First check if the request exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('travel_requests')
      .select('id, employee_id, status')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking if request exists:', checkError);
      
      // Check if the error is a "not found" error
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Travel request not found' },
          { status: 404 }
        );
      }
      
      throw checkError;
    }

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      );
    }

    // Delete any related expense items first
    const { error: expenseError } = await supabase
      .from('expense_items')
      .delete()
      .eq('request_id', id);

    if (expenseError) {
      console.error('Error deleting expense items:', expenseError);
      // Continue with deletion even if expense items deletion fails
    }

    // Delete any related notifications
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('request_id', id);

    if (notificationError) {
      console.error('Error deleting notifications:', notificationError);
      // Continue with deletion even if notifications deletion fails
    }

    // Finally delete the travel request
    const { error: deleteError } = await supabase
      .from('travel_requests')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting travel request:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Travel request and associated data deleted successfully' 
    });
  } catch (error) {
    console.error('Unexpected error deleting travel request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to delete travel request: ${errorMessage}` },
      { status: 500 }
    );
  }
}