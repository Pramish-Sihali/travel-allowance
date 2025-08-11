import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actionItemId = (await params).id;
    const body = await request.json();
    
    const {
      completion_status,
      is_done,
      completed_at,
      completed_by,
      completed_by_name,
      actual_hours,
      remarks
    } = body;

    // Update the meeting action item
    const { data, error } = await supabase
      .from('meeting_minutes')
      .update({
        completion_status,
        is_done,
        completed_at,
        completed_by,
        completed_by_name,
        actual_hours,
        remarks,
        updated_at: new Date().toISOString(),
        updated_by_name: session.user.name,
        toggled_by: session.user.name,
        toggled_at: new Date().toISOString()
      })
      .eq('id', actionItemId)
      .eq('organization_id', session.user.organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating meeting action item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If the item is marked as done, potentially create a task update log
    if (is_done) {
      // Check if this action item is linked to a task
      if (data.task_id) {
        try {
          await supabase
            .from('task_updates')
            .insert({
              task_id: data.task_id,
              user_id: session.user.id,
              update_text: `Completed meeting action item: ${data.responsibility || data.content}`,
              update_type: 'meeting_action_completed',
              organization_id: session.user.organizationId
            });
        } catch (updateError) {
          console.error('Error creating task update:', updateError);
          // Don't fail the main operation if this fails
        }
      }
    }

    // Transform the response to match frontend expectations
    const transformedData = {
      id: data.id,
      content: data.content,
      responsibility: data.responsibility,
      assignedTo: data.assigned_to,
      assignedToName: data.assigned_to_name,
      completionStatus: data.completion_status,
      isDone: data.is_done,
      completedAt: data.completed_at,
      completedBy: data.completed_by,
      completedByName: data.completed_by_name,
      actualHours: data.actual_hours,
      remarks: data.remarks,
      updatedAt: data.updated_at
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in meeting action item PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}