import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const organizationId = session.user.organizationId;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Fetch meetings with related data
    let query = supabase
      .from('meetings')
      .select(`
        *,
        task:tasks(title, status),
        client:clients(name, company),
        assigned_user:users!meetings_assigned_to_fkey(name),
        attendees:meeting_attendees(
          id,
          attendee_name,
          attendee_email,
          attendee_organization,
          attendee_type,
          user:users(name, email)
        ),
        minutes:meeting_minutes(
          id,
          content,
          is_action_item,
          completion_status,
          due_date,
          assigned_to_name
        )
      `)
      .or(`created_by.eq.${employeeId},assigned_to.eq.${employeeId}`);

    // Only add organization filter if organizationId is valid
    if (organizationId && organizationId !== 'undefined') {
      query = query.eq('organization_id', organizationId);
    } else {
      query = query.is('organization_id', null);
    }

    const { data: meetings, error: meetingsError } = await query
      .order('meeting_date', { ascending: false });

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      totalMeetings: meetings?.length || 0,
      scheduledMeetings: meetings?.filter(m => m.status === 'scheduled').length || 0,
      completedMeetings: meetings?.filter(m => m.status === 'completed').length || 0,
      pendingActionItems: 0,
      overdueMeetings: 0,
      upcomingDeadlines: 0
    };

    // Calculate pending action items and overdue meetings
    const currentDate = new Date();
    meetings?.forEach(meeting => {
      // Count pending action items
      if (meeting.minutes) {
        stats.pendingActionItems += meeting.minutes.filter(
          (minute: any) => minute.is_action_item && minute.completion_status === 'pending'
        ).length;
      }

      // Count overdue meetings
      if (meeting.deadline_date) {
        const deadlineDate = new Date(meeting.deadline_date);
        if (deadlineDate < currentDate && meeting.status !== 'completed') {
          stats.overdueMeetings++;
        }
      }

      // Count upcoming deadlines (within next 7 days)
      if (meeting.deadline_date) {
        const deadlineDate = new Date(meeting.deadline_date);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        if (deadlineDate >= currentDate && deadlineDate <= nextWeek && meeting.status !== 'completed') {
          stats.upcomingDeadlines++;
        }
      }
    });

    // Format meetings data for frontend
    const formattedMeetings = meetings?.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      meeting_date: meeting.meeting_date,
      meeting_time: meeting.meeting_time,
      meeting_type: meeting.meeting_type,
      status: meeting.status,
      priority: meeting.priority,
      assigned_to_name: meeting.assigned_to_name,
      deadline_date: meeting.deadline_date,
      location: meeting.location,
      location_type: meeting.location_type,
      task_title: meeting.task?.title,
      client_name: meeting.client?.name,
      client_company: meeting.client?.company,
      attendee_count: meeting.attendees?.length || 0,
      action_items_count: meeting.minutes?.filter((m: any) => m.is_action_item).length || 0,
      completed_action_items: meeting.minutes?.filter(
        (m: any) => m.is_action_item && m.completion_status === 'completed'
      ).length || 0,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at
    }));

    return NextResponse.json({
      meetings: formattedMeetings || [],
      stats
    });

  } catch (error) {
    console.error('Error in meetings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const data = await request.json();

    const {
      title,
      taskId,
      meetingType,
      clientId,
      newClientName,
      locationType,
      locationDetails,
      meetingDate,
      meetingTime,
      duration,
      assignedTo,
      deadlineDate,
      deadlineTime,
      priority,
      meetingMinutes,
      internalAttendees,
      externalAttendees,
      currentLocation,
      createdBy,
      createdByName
    } = data;

    // Validate required fields
    if (!title || !meetingType || !locationType || !locationDetails || !meetingDate || !meetingMinutes) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Handle new client creation if needed
    let finalClientId = clientId;
    if (meetingType === 'external' && newClientName && !clientId) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: newClientName,
          client_type: 'new',
          organization_id: organizationId && organizationId !== 'undefined' ? organizationId : null
        })
        .select()
        .single();

      if (clientError) {
        console.error('Error creating new client:', clientError);
        return NextResponse.json({ error: 'Failed to create new client' }, { status: 500 });
      }

      finalClientId = newClient.id;
    }

    // Get assigned user name if assignedTo is provided
    let assignedToName = null;
    if (assignedTo) {
      const { data: assignedUser } = await supabase
        .from('users')
        .select('name')
        .eq('id', assignedTo)
        .single();
      
      assignedToName = assignedUser?.name;
    }

    // Create meeting record
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        title,
        task_id: taskId || null,
        meeting_type: meetingType,
        client_id: finalClientId || null,
        location: locationDetails,
        location_type: locationType,
        latitude: currentLocation?.lat || null,
        longitude: currentLocation?.lng || null,
        location_address: currentLocation?.address || null,
        meeting_date: meetingDate,
        meeting_time: meetingTime || null,
        duration_minutes: duration ? parseInt(duration) : null,
        created_by: createdBy,
        created_by_name: createdByName,
        assigned_to: assignedTo || null,
        assigned_to_name: assignedToName,
        deadline_date: deadlineDate || null,
        deadline_time: deadlineTime || null,
        priority: priority || 'medium',
        status: 'scheduled',
        organization_id: organizationId && organizationId !== 'undefined' ? organizationId : null
      })
      .select()
      .single();

    if (meetingError) {
      console.error('Error creating meeting:', meetingError);
      return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }

    // Add internal attendees
    if (internalAttendees && internalAttendees.length > 0) {
      const internalAttendeesData = internalAttendees.map((attendee: any) => ({
        meeting_id: meeting.id,
        user_id: attendee.id,
        attendee_name: attendee.name,
        attendee_email: attendee.email,
        attendee_type: 'internal',
        organization_id: organizationId && organizationId !== 'undefined' ? organizationId : null
      }));

      const { error: attendeesError } = await supabase
        .from('meeting_attendees')
        .insert(internalAttendeesData);

      if (attendeesError) {
        console.error('Error adding internal attendees:', attendeesError);
        // Don't fail the entire operation for attendee errors
      }
    }

    // Add external attendees
    if (externalAttendees && externalAttendees.length > 0) {
      const externalAttendeesData = externalAttendees.map((attendee: any) => ({
        meeting_id: meeting.id,
        user_id: null,
        attendee_name: attendee.name,
        attendee_email: attendee.email,
        attendee_organization: attendee.organization || null,
        attendee_type: 'external',
        organization_id: organizationId && organizationId !== 'undefined' ? organizationId : null
      }));

      const { error: externalAttendeesError } = await supabase
        .from('meeting_attendees')
        .insert(externalAttendeesData);

      if (externalAttendeesError) {
        console.error('Error adding external attendees:', externalAttendeesError);
        // Don't fail the entire operation for attendee errors
      }
    }

    // Process and save meeting minutes as bullet points
    const minutesList = meetingMinutes
      .split('\n')
      .filter((line: string) => line.trim() !== '')
      .map((line: string, index: number) => ({
        meeting_id: meeting.id,
        content: line.trim(),
        minute_order: index + 1,
        is_action_item: false, // For now, all are regular minutes. Can be enhanced later
        organization_id: organizationId && organizationId !== 'undefined' ? organizationId : null
      }));

    if (minutesList.length > 0) {
      const { error: minutesError } = await supabase
        .from('meeting_minutes')
        .insert(minutesList);

      if (minutesError) {
        console.error('Error saving meeting minutes:', minutesError);
        // Don't fail the entire operation for minutes errors
      }
    }

    // Create deadline assignment if assigned to someone
    if (assignedTo && deadlineDate) {
      const { error: assignmentError } = await supabase
        .from('meeting_deadline_assignments')
        .insert({
          meeting_id: meeting.id,
          assigned_to: assignedTo,
          assigned_to_name: assignedToName,
          assigned_by: createdBy,
          assigned_by_name: createdByName,
          assignment_type: 'meeting',
          deadline_date: deadlineDate,
          deadline_time: deadlineTime || null,
          priority: priority || 'medium',
          description: `Meeting follow-up: ${title}`,
          completion_status: 'assigned',
          organization_id: organizationId && organizationId !== 'undefined' ? organizationId : null
        });

      if (assignmentError) {
        console.error('Error creating deadline assignment:', assignmentError);
        // Don't fail the entire operation for assignment errors
      }
    }

    return NextResponse.json({ 
      success: true, 
      meetingId: meeting.id,
      message: 'Meeting created successfully' 
    });

  } catch (error) {
    console.error('Error in meetings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}