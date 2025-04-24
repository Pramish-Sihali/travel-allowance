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
): Promise<NextResponse> {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const employeeId = travelRequest.employeeId
    let newStatus = status
    let notificationMessage = ''
    let notifyCheckers = false

    if (role === 'approver' && status === 'approved') {
      // For regular requests, set to travel_approved
      newStatus = 'travel_approved'
      notificationMessage = `Your travel request has been approved. You can now submit your expenses after your travel is complete.`
      
      // For advance or emergency requests, also notify checkers immediately
      if (travelRequest.requestType === 'advance' || travelRequest.requestType === 'emergency') {
        notifyCheckers = true
        
        // For emergency requests, add more specific messaging
        if (travelRequest.requestType === 'emergency') {
          notificationMessage = `Your emergency travel request has been approved. Finance will be notified for expedited processing.`
        } else if (travelRequest.requestType === 'advance') {
          notificationMessage = `Your advance travel request has been approved. Finance will be notified to process your advance payment.`
        }
      }
    } else if (
      role === 'checker' &&
      status === 'approved' &&
      travelRequest.status === 'pending_verification'
    ) {
      newStatus = 'approved'
      notificationMessage = `Your travel request and expenses have been fully approved and processed`
    } else if (role === 'checker' && status === 'rejected') {
      newStatus = 'rejected_by_checker'
      notificationMessage = `Your travel expenses have been rejected during financial verification`
    } else if (role === 'approver' && status === 'rejected') {
      newStatus = 'rejected'
      notificationMessage = `Your travel request has been rejected`
    }

    console.log(`Updating request status from ${travelRequest.status} to ${newStatus}`)

    const updatedData: Record<string, any> = { status: newStatus }
    if (role === 'approver') {
      updatedData.approverComments = comments
      if (newStatus === 'travel_approved') {
        updatedData.travel_details_approved_at = new Date().toISOString()
        
        // For advance requests, add a flag to indicate it needs financial attention
        if (travelRequest.requestType === 'advance') {
          updatedData.needs_financial_attention = true
        }
        
        // For emergency requests, add a flag to indicate it's urgent
        if (travelRequest.requestType === 'emergency') {
          updatedData.needs_financial_attention = true
          updatedData.is_urgent = true
        }
      }
    } else if (role === 'checker') {
      updatedData.checkerComments = comments
    }

    const updatedRequest = await updateTravelRequestStatus(
      id,
      newStatus as any,
      updatedData
    )

    if (!updatedRequest) {
      console.error('Failed to update travel request')
      return NextResponse.json(
        { error: 'Failed to update travel request status' },
        { status: 500 }
      )
    }

    try {
      console.log(`Creating notification for employee ${employeeId}`)
      await createNotification({
        userId: employeeId,
        requestId: id,
        message:
          notificationMessage ||
          `Your travel request has been ${status}`,
      })
      console.log('Employee notification created successfully')

      // Notify checkers if it's a new verification request or an approved advance/emergency request
      if (newStatus === 'pending_verification' || notifyCheckers) {
        const { data: checkers, error: checkersError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'checker')

        if (!checkersError && checkers?.length) {
          console.log(`Notifying ${checkers.length} checkers`)
          for (const checker of checkers) {
            // Customize the notification message based on request type
            let checkerMessage = 'A new travel request is waiting for your financial verification';
            
            if (travelRequest.requestType === 'advance' && notifyCheckers) {
              checkerMessage = 'An approved advance request requires your immediate attention for fund disbursement';
            } else if (travelRequest.requestType === 'emergency' && notifyCheckers) {
              checkerMessage = 'URGENT: An emergency travel request has been approved and requires your immediate attention';
            }
            
            await createNotification({
              userId: checker.id,
              requestId: id,
              message: checkerMessage,
            })
          }
        } else if (checkersError) {
          console.error('Error fetching checkers:', checkersError)
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    console.log('Request successfully updated to:', newStatus)
    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating travel request:', error)
    return NextResponse.json(
      { error: 'Failed to update travel request' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can delete requests' },
        { status: 401 }
      )
    }

    console.log(`Attempting to delete travel request with ID: ${id}`)

    const { data: existingRequest, error: checkError } = await supabase
      .from('travel_requests')
      .select('id, employee_id, status')
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('Error checking if request exists:', checkError)
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Travel request not found' },
          { status: 404 }
        )
      }
      throw checkError
    }

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Travel request not found' },
        { status: 404 }
      )
    }

    const { error: expenseError } = await supabase
      .from('expense_items')
      .delete()
      .eq('request_id', id)
    if (expenseError) {
      console.error('Error deleting expense items:', expenseError)
    }

    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('request_id', id)
    if (notificationError) {
      console.error('Error deleting notifications:', notificationError)
    }

    const { error: deleteError } = await supabase
      .from('travel_requests')
      .delete()
      .eq('id', id)
    if (deleteError) {
      console.error('Error deleting travel request:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message:
        'Travel request and associated data deleted successfully',
    })
  } catch (error) {
    console.error('Unexpected error deleting travel request:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: `Failed to delete travel request: ${errorMessage}`,
      },
      { status: 500 }
    )
  }
}