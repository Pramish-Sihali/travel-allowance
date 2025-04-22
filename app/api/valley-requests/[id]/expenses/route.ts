// app/api/valley-requests/[id]/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Await the dynamic route params
  const { id } = await params;

  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('Authentication failed: No session or user');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Updating valley request with expenses:', { id, body });

    // First check if the request exists and belongs to the user
    const { data: existingRequest, error: checkError } = await supabase
      .from('valley_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingRequest) {
      console.error('Valley request not found', checkError);
      return NextResponse.json(
        { error: 'Valley request not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this request
    const isOwner = existingRequest.employee_id === session.user.id;
    const isAdmin = session.user.role === 'admin';
    const isChecker = session.user.role === 'checker';
    const isApprover = session.user.role === 'approver';

    if (!isOwner && !isAdmin && !isChecker && !isApprover) {
      console.error('Permission denied: User does not have appropriate role', {
        requestEmployeeId: existingRequest.employee_id,
        userId: session.user.id,
        userRole: session.user.role
      });
      return NextResponse.json(
        { error: 'You do not have permission to update this request' },
        { status: 403 }
      );
    }
    // Check if the request is in a valid state
    const validStates = ['pending', 'travel_approved'];
    if (!validStates.includes(existingRequest.status)) {
      return NextResponse.json(
        { error: `This valley request is not in a valid state for expense submission (current state: ${existingRequest.status})` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      total_amount: body.totalAmount || 0,
      status: 'pending_verification',
      expenses_submitted_at: new Date().toISOString(),
      phase: 2,
      updated_at: new Date().toISOString()
    };

    // Update the request
    const { data, error } = await supabase
      .from('valley_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating valley request with expenses:', error);
      return NextResponse.json(
        { error: 'Failed to update valley request with expenses' },
        { status: 500 }
      );
    }

    // Create notification for finance department (checkers)
    try {
      const { data: checkers, error: checkersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'checker');

      if (!checkersError && checkers?.length) {
        for (const checker of checkers) {
          await createNotification({
            userId: checker.id,
            requestId: id,
            message: `A valley expense submission is waiting for your financial verification`,
          });
        }
      }

      // Notify the employee
      await createNotification({
        userId: existingRequest.employee_id,
        requestId: id,
        message: `Your valley expense submission has been received and is pending financial verification`,
      });
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue despite notification error
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in valley expenses PATCH:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: String(error) },
      { status: 500 }
    );
  }
}
