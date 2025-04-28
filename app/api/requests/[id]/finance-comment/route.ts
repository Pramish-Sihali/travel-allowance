// app/api/requests/[id]/finance-comment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Get the request ID from the URL
    const { id } = await params;
    
    // Check if user is authenticated and is a checker
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'checker') {
      return NextResponse.json(
        { error: 'Unauthorized. Only financial checkers can send finance comments.' },
        { status: 401 }
      );
    }

    // Parse the request body to get the comment
    const body = await request.json();
    const { comment } = body;

    if (!comment || typeof comment !== 'string' || comment.trim() === '') {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    // Check if the request exists
    const { data: requestData, error: requestError } = await supabase
      .from('travel_requests')
      .select('id, employee_id, status')
      .eq('id', id)
      .single();

    if (requestError) {
      // Try for valley request if travel request doesn't exist
      const { data: valleyRequestData, error: valleyRequestError } = await supabase
        .from('valley_requests')
        .select('id, employee_id, status')
        .eq('id', id)
        .single();

      if (valleyRequestError) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      // If it's a valley request, update the finance_comments field
      const { data: updatedRequest, error: updateError } = await supabase
        .from('valley_requests')
        .update({
          finance_comments: comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating valley request with finance comment:', updateError);
        return NextResponse.json(
          { error: 'Failed to update request with finance comment' },
          { status: 500 }
        );
      }

      // Create a notification for the employee
      try {
        await createNotification({
          userId: valleyRequestData.employee_id,
          requestId: id,
          message: `Financial comment received: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue despite notification error
      }

      return NextResponse.json({
        success: true,
        message: 'Finance comment added successfully',
        requestType: 'valley'
      });
    }

    // It's a travel request, update the finance_comments field
    const { data: updatedRequest, error: updateError } = await supabase
      .from('travel_requests')
      .update({
        finance_comments: comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating travel request with finance comment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request with finance comment' },
        { status: 500 }
      );
    }

    // Create a notification for the employee
    try {
      await createNotification({
        userId: requestData.employee_id,
        requestId: id,
        message: `Financial comment received: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue despite notification error
    }

    return NextResponse.json({
      success: true,
      message: 'Finance comment added successfully',
      requestType: 'travel'
    });

  } catch (error) {
    console.error('Unexpected error in finance comment POST:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}