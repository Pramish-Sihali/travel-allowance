// app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getTravelRequestById,
  updateTravelRequestStatus,
  createNotification,
} from '@/lib/db'
import { supabase } from '@/lib/supabase'

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

// Add this function to lib/db.ts

export const deleteTravelRequest = async (id: string) => {
  try {
    // First delete any related expense items and receipts
    // This assumes you have cascade delete set up in your database
    // If not, you'd need to handle deleting related records explicitly
    
    const { error } = await supabase
      .from('travel_requests')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting travel request:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in deleteTravelRequest:', error);
    return false;
  }
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('Request ID from params:', id)
    const body = await request.json()
    console.log('Request body:', body)

    const { status, comments, role } = body
    if (!status || !role) {
      console.error('Missing required parameters:', { status, role })
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const travelRequest = await getTravelRequestById(id)
    if (!travelRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      )
    }

    let newStatus = status
    let notificationMessage = ''

    if (role === 'approver' && status === 'approved') {
      newStatus = 'pending_verification'
      notificationMessage = `Your travel request has been approved by the approver and is pending financial verification`
    } else if (
      role === 'checker' &&
      status === 'approved' &&
      travelRequest.status === 'pending_verification'
    ) {
      newStatus = 'approved'
      notificationMessage = `Your travel request has been fully approved and processed`
    } else if (role === 'checker' && status === 'rejected') {
      newStatus = 'rejected_by_checker'
      notificationMessage = `Your travel request has been rejected during financial verification`
    } else if (role === 'approver' && status === 'rejected') {
      newStatus = 'rejected'
      notificationMessage = `Your travel request has been rejected`
    }

    const updatedData: Record<string, any> = {}
    if (role === 'approver') {
      updatedData.approverComments = comments
    } else if (role === 'checker') {
      updatedData.checkerComments = comments
    }

    const updatedRequest = await updateTravelRequestStatus(
      id,
      newStatus,
      updatedData
    )
    if (!updatedRequest) {
      console.error('Failed to update travel request')
      return NextResponse.json(
        { error: 'Failed to update travel request status' },
        { status: 500 }
      )
    }

    // Notify employee
    try {
      await createNotification({
        userId: updatedRequest.employeeId,
        requestId: updatedRequest.id,
        message:
          notificationMessage || `Your travel request has been ${status}`,
      })
      if (newStatus === 'pending_verification') {
        // notify checkers (stubbed)
        await createNotification({
          userId: 'checker1',
          requestId: updatedRequest.id,
          message: `A new travel request is waiting for your financial verification`,
        })
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating travel request:', error)
    return NextResponse.json(
      { error: 'Failed to update travel request' },
      { status: 400 }
    )
  }
}
