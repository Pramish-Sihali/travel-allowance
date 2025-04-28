// app/api/requests/[id]/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    console.log('Updating travel request with expenses:', { id, body });

    // First check if the request exists and belongs to the user
    const { data: existingRequest, error: checkError } = await supabase
      .from('travel_requests')
      .select('*')
      .eq('id', id)
      .eq('employee_id', session.user.id)
      .single();

    if (checkError || !existingRequest) {
      return NextResponse.json(
        { error: 'Travel request not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // Check if the request is in the correct state (travel_approved)
    // if (existingRequest.status !== 'travel_approved') {
    //   return NextResponse.json(
    //     { error: 'This travel request is not ready for expense submission' },
    //     { status: 400 }
    //   );
    // }

    


    // Prepare update data
    const updateData = {
      total_amount: body.totalAmount || 0,
      previous_outstanding_advance: body.previousOutstandingAdvance || 0,
      status: 'pending_verification',
      expenses_submitted_at: new Date().toISOString(),
      phase: 2,
      updated_at: new Date().toISOString()
    };

    // Update the request
    const { data, error } = await supabase
      .from('travel_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating travel request with expenses:', error);
      return NextResponse.json(
        { error: 'Failed to update travel request with expenses' },
        { status: 500 }
      );
    }

    // Create notification for finance department (checkers)
    try {
      // Get all users with checker role
      const { data: checkers, error: checkersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'checker');

      if (!checkersError && checkers && checkers.length > 0) {
        // Create notifications for each checker
        for (const checker of checkers) {
          await createNotification({
            userId: checker.id,
            requestId: id,
            message: `A travel expense submission is waiting for your financial verification`,
          });
        }
      }

      // Notify the employee
      await createNotification({
        userId: session.user.id,
        requestId: id,
        message: `Your travel expense submission has been received and is pending financial verification`,
      });
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue despite notification error
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in expenses PATCH:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}