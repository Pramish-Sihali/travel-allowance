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
      meetingQuery = meetingQuery.eq('organizationid', organizationId);
    } else {
      meetingQuery = meetingQuery.is('organizationid', null);
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
        attendeename,
        attendeeemail,
        attendeeorganization,
        attendeetype,
        attendancestatus,
        user:users(name, email)
      `)
      .eq('meetingid', meetingId);

    if (organizationId && organizationId !== 'undefined') {
      attendeesQuery = attendeesQuery.eq('organizationid', organizationId);
    } else {
      attendeesQuery = attendeesQuery.is('organizationid', null);
    }

    const { data: attendees, error: attendeesError } = await attendeesQuery;

    // Fetch meeting minutes
    let minutesQuery = supabaseAdmin
      .from('meeting_minutes')
      .select(`
        id,
        content,
        minuteorder,
        isactionitem,
        completionstatus,
        assignedtoname,
        duedate,
        priority,
        completionpercentage,
        completedat,
        completedbyname
      `)
      .eq('meetingid', meetingId);

    if (organizationId && organizationId !== 'undefined') {
      minutesQuery = minutesQuery.eq('organizationid', organizationId);
    } else {
      minutesQuery = minutesQuery.is('organizationid', null);
    }

    const { data: minutes, error: minutesError } = await minutesQuery.order('minuteorder');

    // Fetch related task info if exists with organization filter
    let task = null;
    if (meeting.taskid) {
      let taskQuery = supabaseAdmin
        .from('tasks')
        .select('title, status, organizationid')
        .eq('id', meeting.taskid);

      // Apply organization filter
      if (organizationId && organizationId !== 'undefined') {
        taskQuery = taskQuery.eq('organizationid', organizationId);
      } else {
        taskQuery = taskQuery.is('organizationid', null);
      }
      
      const { data: taskData } = await taskQuery.single();
      task = taskData;
    }

    // Fetch related client info if exists with organization filter
    let client = null;
    if (meeting.clientid) {
      let clientQuery = supabaseAdmin
        .from('clients')
        .select('name, company, organizationid')
        .eq('id', meeting.clientid);

      // Apply organization filter
      if (organizationId && organizationId !== 'undefined') {
        clientQuery = clientQuery.eq('organizationid', organizationId);
      } else {
        clientQuery = clientQuery.is('organizationid', null);
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