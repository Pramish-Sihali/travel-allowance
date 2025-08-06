import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const data = await request.json();

    const {
      parentMeetingId,
      incompleteItems,
      createdBy,
      title,
      scheduledDate,
      scheduledTime,
      location,
      locationType = 'office'
    } = data;

    // Validate required fields
    if (!parentMeetingId || !incompleteItems || !Array.isArray(incompleteItems)) {
      return NextResponse.json({ 
        error: 'Parent meeting ID and incomplete items are required' 
      }, { status: 400 });
    }

    // Get parent meeting details
    const { data: parentMeeting, error: parentError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', parentMeetingId)
      .eq('organization_id', organizationId)
      .single();

    if (parentError || !parentMeeting) {
      return NextResponse.json({ error: 'Parent meeting not found' }, { status: 404 });
    }

    // Get creator details
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('name')
      .eq('id', createdBy)
      .single();

    const creatorName = creator?.name || 'Unknown User';

    // Create follow-up meeting
    const followUpTitle = title || `Follow-up: ${parentMeeting.title}`;
    const followUpDate = scheduledDate || new Date().toISOString().split('T')[0];
    
    const { data: followUpMeeting, error: followUpError } = await supabase
      .from('meetings')
      .insert({
        title: followUpTitle,
        task_id: parentMeeting.task_id,
        meeting_type: parentMeeting.meeting_type,
        client_id: parentMeeting.client_id,
        location: location || parentMeeting.location,
        location_type: locationType,
        meeting_date: followUpDate,
        meeting_time: scheduledTime || null,
        created_by: createdBy,
        created_by_name: creatorName,
        assigned_to: parentMeeting.assigned_to,
        assigned_to_name: parentMeeting.assigned_to_name,
        priority: 'medium',
        status: 'scheduled',
        organization_id: organizationId
      })
      .select()
      .single();

    if (followUpError) {
      console.error('Error creating follow-up meeting:', followUpError);
      return NextResponse.json({ error: 'Failed to create follow-up meeting' }, { status: 500 });
    }

    // Create follow-up relationship
    const { error: relationshipError } = await supabase
      .from('meeting_follow_ups')
      .insert({
        parent_meeting_id: parentMeetingId,
        follow_up_meeting_id: followUpMeeting.id,
        follow_up_type: 'action_items',
        organization_id: organizationId
      });

    if (relationshipError) {
      console.error('Error creating follow-up relationship:', relationshipError);
      // Continue even if relationship creation fails
    }

    // Copy incomplete items as new meeting minutes
    const followUpMinutes = incompleteItems.map((item: any, index: number) => ({
      meeting_id: followUpMeeting.id,
      content: item.content,
      minute_order: index + 1,
      is_action_item: true,
      assigned_to: item.assigned_to || null,
      assigned_to_name: item.assigned_to_name || null,
      due_date: item.due_date || null,
      due_time: item.due_time || null,
      priority: item.priority || 'medium',
      completion_status: 'pending',
      organization_id: organizationId
    }));

    if (followUpMinutes.length > 0) {
      const { error: minutesError } = await supabase
        .from('meeting_minutes')
        .insert(followUpMinutes);

      if (minutesError) {
        console.error('Error creating follow-up minutes:', minutesError);
        // Don't fail the entire operation for minutes errors
      }
    }

    // Copy attendees from parent meeting
    const { data: parentAttendees, error: attendeesError } = await supabase
      .from('meeting_attendees')
      .select('*')
      .eq('meeting_id', parentMeetingId)
      .eq('organization_id', organizationId);

    if (!attendeesError && parentAttendees && parentAttendees.length > 0) {
      const followUpAttendees = parentAttendees.map(attendee => ({
        meeting_id: followUpMeeting.id,
        user_id: attendee.user_id,
        attendee_name: attendee.attendee_name,
        attendee_email: attendee.attendee_email,
        attendee_organization: attendee.attendee_organization,
        attendee_type: attendee.attendee_type,
        attendance_status: 'invited',
        organization_id: organizationId
      }));

      const { error: copyAttendeesError } = await supabase
        .from('meeting_attendees')
        .insert(followUpAttendees);

      if (copyAttendeesError) {
        console.error('Error copying attendees:', copyAttendeesError);
        // Don't fail the entire operation
      }
    }

    return NextResponse.json({
      success: true,
      followUpMeeting: {
        id: followUpMeeting.id,
        title: followUpMeeting.title,
        meeting_date: followUpMeeting.meeting_date,
        meeting_time: followUpMeeting.meeting_time
      },
      copiedItems: followUpMinutes.length,
      message: `Follow-up meeting created with ${followUpMinutes.length} action items`
    });

  } catch (error) {
    console.error('Error in follow-up POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}