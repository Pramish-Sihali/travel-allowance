import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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
    let query = supabaseAdmin
      .from('meetings')
      .select(`
        *,
        task:tasks(title, status),
        client:clients(name, company),
        assignedUser:users!meetings_assigned_to_fkey(name),
        attendees:meeting_attendees(
          id,
          attendeename,
          attendeeemail,
          attendeeorganization,
          attendeetype,
          user:users(name, email)
        ),
        minutes:meeting_minutes(
          id,
          content,
          responsibility,
          serialno,
          isactionitem,
          completionstatus,
          duedate,
          assignedtoname,
          assignedto,
          remarks,
          flags,
          isdone,
          toggledby,
          toggledat,
          createdbyname,
          updatedbyname,
          priority
        )
      `)
      .or(`createdby.eq.${employeeId},assignedto.eq.${employeeId}`);

    // Only add organization filter if organizationId is valid
    if (organizationId && organizationId !== 'undefined') {
      query = query.eq('organizationid', organizationId);
    } else {
      query = query.is('organizationid', null);
    }

    const { data: meetings, error: meetingsError } = await query
      .order('meetingdate', { ascending: false });

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
          (minute: any) => minute.isactionitem && minute.completionstatus === 'pending'
        ).length;
      }

      // Count overdue meetings
      if (meeting.deadlinedate) {
        const deadlineDate = new Date(meeting.deadlinedate);
        if (deadlineDate < currentDate && meeting.status !== 'completed') {
          stats.overdueMeetings++;
        }
      }

      // Count upcoming deadlines (within next 7 days)
      if (meeting.deadlinedate) {
        const deadlineDate = new Date(meeting.deadlinedate);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        if (deadlineDate >= currentDate && deadlineDate <= nextWeek && meeting.status !== 'completed') {
          stats.upcomingDeadlines++;
        }
      }
    });

    // Format meetings data for frontend - no transformation needed!
    const formattedMeetings = meetings?.map(meeting => ({
      ...meeting,
      taskTitle: meeting.task?.title,
      clientName: meeting.client?.name,
      clientCompany: meeting.client?.company,
      attendeeCount: meeting.attendees?.length || 0,
      actionItemsCount: meeting.minutes?.filter((m: any) => m.isactionitem).length || 0,
      completedActionItems: meeting.minutes?.filter(
        (m: any) => m.isactionitem && m.completionstatus === 'completed'
      ).length || 0
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
    if (!title || !meetingType || !locationType || !locationDetails || !meetingDate) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate meeting minutes
    if (!meetingMinutes || !Array.isArray(meetingMinutes) || meetingMinutes.length === 0) {
      return NextResponse.json({ 
        error: 'Meeting minutes are required' 
      }, { status: 400 });
    }

    // Handle new client creation if needed
    let finalClientId = clientId;
    if (meetingType === 'external' && newClientName && !clientId) {
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          name: newClientName,
          clienttype: 'new',
          organizationid: organizationId && organizationId !== 'undefined' ? organizationId : null
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
      const { data: assignedUser } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', assignedTo)
        .single();
      
      assignedToName = assignedUser?.name;
    }

    // Create meeting record
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .insert({
        title,
        taskid: taskId || null,
        meetingtype: meetingType,
        clientid: finalClientId || null,
        location: locationDetails,
        locationtype: locationType,
        latitude: currentLocation?.lat || null,
        longitude: currentLocation?.lng || null,
        locationaddress: currentLocation?.address || null,
        meetingdate: meetingDate,
        meetingtime: meetingTime || null,
        durationminutes: duration ? parseInt(duration) : null,
        createdby: createdBy,
        createdbyname: createdByName,
        assignedto: assignedTo || null,
        assignedtoname: assignedToName,
        deadlinedate: deadlineDate || null,
        deadlinetime: deadlineTime || null,
        priority: priority || 'medium',
        status: 'scheduled',
        organizationid: organizationId && organizationId !== 'undefined' ? organizationId : null
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
        meetingid: meeting.id,
        userid: attendee.id,
        attendeename: attendee.name,
        attendeeemail: attendee.email,
        attendeetype: 'internal',
        organizationid: organizationId && organizationId !== 'undefined' ? organizationId : null
      }));

      const { error: attendeesError } = await supabaseAdmin
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
        meetingid: meeting.id,
        userid: null,
        attendeename: attendee.name,
        attendeeemail: attendee.email,
        attendeeorganization: attendee.organization || null,
        attendeetype: 'external',
        organizationid: organizationId && organizationId !== 'undefined' ? organizationId : null
      }));

      const { error: externalAttendeesError } = await supabaseAdmin
        .from('meeting_attendees')
        .insert(externalAttendeesData);

      if (externalAttendeesError) {
        console.error('Error adding external attendees:', externalAttendeesError);
        // Don't fail the entire operation for attendee errors
      }
    }

    // Process and save meeting minutes from table format
    const minutesList = meetingMinutes.map((minute: any) => ({
      meetingid: meeting.id,
      content: minute.responsibility,
      responsibility: minute.responsibility,
      serialno: minute.serialNo || 1,
      minuteorder: minute.serialNo || 1,
      isactionitem: true,
      assignedto: minute.assignedToId || null,
      assignedtoname: minute.assignedToName,
      duedate: minute.deadline || null,
      duetime: null,
      priority: 'medium',
      completionstatus: minute.isDone ? 'completed' : 'pending',
      completionpercentage: minute.isDone ? 100 : 0,
      estimatedhours: null,
      actualhours: null,
      deadlinenotes: minute.remarks,
      remarks: minute.remarks,
      flags: minute.flags || '',
      isdone: minute.isDone,
      toggledby: minute.toggledBy || null,
      toggledat: minute.toggledAt || (minute.isDone ? new Date().toISOString() : null),
      remindersent: false,
      completedat: minute.isDone ? new Date().toISOString() : null,
      completedbyname: minute.toggledBy || null,
      createdbyname: createdByName,
      updatedbyname: createdByName,
      organizationid: organizationId && organizationId !== 'undefined' ? organizationId : null
    }));

    if (minutesList.length > 0) {
      const { error: minutesError } = await supabaseAdmin
        .from('meeting_minutes')
        .insert(minutesList);

      if (minutesError) {
        console.error('Error saving meeting minutes:', minutesError);
        // Don't fail the entire operation for minutes errors
      }
    }

    // Create deadline assignment if assigned to someone
    if (assignedTo && deadlineDate) {
      const { error: assignmentError } = await supabaseAdmin
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