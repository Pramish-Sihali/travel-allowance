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

    // Fetch meeting basic info
    let meetingQuery = supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId);

    if (organizationId && organizationId !== 'undefined') {
      meetingQuery = meetingQuery.eq('organization_id', organizationId);
    } else {
      meetingQuery = meetingQuery.is('organization_id', null);
    }

    const { data: meeting, error: meetingError } = await meetingQuery.single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Fetch attendees
    let attendeesQuery = supabase
      .from('meeting_attendees')
      .select(`
        id,
        attendee_name,
        attendee_email,
        attendee_organization,
        attendee_type,
        attendance_status,
        user:users(name, email)
      `)
      .eq('meeting_id', meetingId);

    if (organizationId && organizationId !== 'undefined') {
      attendeesQuery = attendeesQuery.eq('organization_id', organizationId);
    } else {
      attendeesQuery = attendeesQuery.is('organization_id', null);
    }

    const { data: attendees, error: attendeesError } = await attendeesQuery;

    // Fetch meeting minutes
    let minutesQuery = supabase
      .from('meeting_minutes')
      .select(`
        id,
        content,
        minute_order,
        is_action_item,
        completion_status,
        assigned_to_name,
        due_date,
        priority,
        completion_percentage,
        completed_at,
        completed_by_name
      `)
      .eq('meeting_id', meetingId);

    if (organizationId && organizationId !== 'undefined') {
      minutesQuery = minutesQuery.eq('organization_id', organizationId);
    } else {
      minutesQuery = minutesQuery.is('organization_id', null);
    }

    const { data: minutes, error: minutesError } = await minutesQuery.order('minute_order');

    // Fetch related task info if exists
    let task = null;
    if (meeting.task_id) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('title, status')
        .eq('id', meeting.task_id)
        .single();
      
      task = taskData;
    }

    // Fetch related client info if exists
    let client = null;
    if (meeting.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('name, company')
        .eq('id', meeting.client_id)
        .single();
      
      client = clientData;
    }

    return NextResponse.json({
      meeting,
      attendees: attendees || [],
      minutes: minutes || [],
      task,
      client
    });

  } catch (error) {
    console.error('Error in meeting details GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}