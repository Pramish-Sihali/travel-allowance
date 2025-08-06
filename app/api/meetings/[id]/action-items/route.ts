import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: meetingId } = await context.params;
    const organizationId = session.user.organizationId;

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // First verify the meeting exists and user has access
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id, title, meeting_date')
      .eq('id', meetingId)
      .eq('organization_id', organizationId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Fetch all meeting minutes (both regular and action items)
    const { data: minutes, error: minutesError } = await supabase
      .from('meeting_minutes')
      .select(`
        id,
        content,
        is_action_item,
        completion_status,
        due_date,
        due_time,
        priority,
        assigned_to_name,
        completion_percentage,
        estimated_hours,
        actual_hours,
        deadline_notes,
        completed_at,
        completed_by_name,
        created_at,
        updated_at
      `)
      .eq('meeting_id', meetingId)
      .eq('organization_id', organizationId)
      .order('minute_order');

    if (minutesError) {
      console.error('Error fetching meeting minutes:', minutesError);
      return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
    }

    // Format the data for frontend
    const actionItems = (minutes || []).map(minute => ({
      id: minute.id,
      meeting_id: meetingId,
      content: minute.content,
      is_action_item: minute.is_action_item,
      completion_status: minute.completion_status,
      due_date: minute.due_date,
      due_time: minute.due_time,
      priority: minute.priority,
      assigned_to_name: minute.assigned_to_name,
      completion_percentage: minute.completion_percentage || 0,
      estimated_hours: minute.estimated_hours,
      actual_hours: minute.actual_hours,
      deadline_notes: minute.deadline_notes,
      completed_at: minute.completed_at,
      completed_by_name: minute.completed_by_name,
      meeting_title: meeting.title,
      meeting_date: meeting.meeting_date,
      created_at: minute.created_at,
      updated_at: minute.updated_at
    }));

    // Calculate statistics
    const stats = {
      total: actionItems.length,
      actionItems: actionItems.filter(item => item.is_action_item).length,
      completed: actionItems.filter(item => item.completion_status === 'completed').length,
      pending: actionItems.filter(item => item.completion_status === 'pending').length,
      inProgress: actionItems.filter(item => item.completion_status === 'in_progress').length,
      overdue: actionItems.filter(item => {
        if (item.completion_status === 'completed' || item.completion_status === 'cancelled') return false;
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return dueDate < today;
      }).length
    };

    return NextResponse.json({
      actionItems,
      stats,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        meeting_date: meeting.meeting_date
      }
    });

  } catch (error) {
    console.error('Error in action-items GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}