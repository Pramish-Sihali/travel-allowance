import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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
    let meetingQuery = supabaseAdmin
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
    let attendeesQuery = supabaseAdmin
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
    let minutesQuery = supabaseAdmin
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

    // Fetch related task info if exists with organization filter
    let task = null;
    if (meeting.task_id) {
      let taskQuery = supabaseAdmin
        .from('tasks')
        .select('title, status, organization_id')
        .eq('id', meeting.task_id);

      // Apply organization filter
      if (organizationId && organizationId !== 'undefined') {
        taskQuery = taskQuery.eq('organization_id', organizationId);
      } else {
        taskQuery = taskQuery.is('organization_id', null);
      }
      
      const { data: taskData } = await taskQuery.single();
      task = taskData;
    }

    // Fetch related client info if exists with organization filter
    let client = null;
    if (meeting.client_id) {
      let clientQuery = supabaseAdmin
        .from('clients')
        .select('name, company, organization_id')
        .eq('id', meeting.client_id);

      // Apply organization filter
      if (organizationId && organizationId !== 'undefined') {
        clientQuery = clientQuery.eq('organization_id', organizationId);
      } else {
        clientQuery = clientQuery.is('organization_id', null);
      }
      
      const { data: clientData } = await clientQuery.single();
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