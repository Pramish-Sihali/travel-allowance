// app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized - No organization found' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', session.user.organizationId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Convert snake_case to camelCase for frontend
    const events = data.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      startTime: event.start_time,
      endTime: event.end_time,
      isAllDay: event.is_all_day,
      eventType: event.event_type,
      location: event.location,
      hallId: event.hall_id,
      createdBy: event.created_by,
      createdByName: event.created_by_name,
      createdByRole: event.created_by_role,
      maxAttendees: event.max_attendees,
      currentAttendees: event.current_attendees,
      requiresApproval: event.requires_approval,
      approvalStatus: event.approval_status,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Exception in GET /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized - No organization found' }, { status: 401 });
    }

    // Get user information
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, startDate, endDate, startTime, endTime, isAllDay, eventType, location, maxAttendees, hallId } = body;

    // Define event types that require approver role
    const approverOnlyEvents = ['company_meeting', 'training', 'holiday', 'deadline', 'announcement'];
    
    // Check permissions based on event type
    if (approverOnlyEvents.includes(eventType) && !['approver', 'admin'].includes(userData.role)) {
      return NextResponse.json({ 
        error: `Only approvers can create ${eventType.replace('_', ' ')} events` 
      }, { status: 403 });
    }

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Title, start date, and end date are required' }, { status: 400 });
    }

    const insertData = {
      title,
      description: description || '',
      start_date: startDate,
      end_date: endDate,
      start_time: startTime || null,
      end_time: endTime || null,
      is_all_day: isAllDay || false,
      event_type: eventType || 'general',
      location: location || '',
      hall_id: hallId || null,
      created_by: session.user.id,
      created_by_name: userData.name,
      created_by_role: userData.role,
      max_attendees: maxAttendees || null,
      current_attendees: 0,
      requires_approval: false, // For now, all events are auto-approved
      approval_status: 'approved',
      organization_id: session.user.organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newEvent, error } = await supabase
      .from('events')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Convert to camelCase for response
    const formattedEvent = {
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description,
      startDate: newEvent.start_date,
      endDate: newEvent.end_date,
      startTime: newEvent.start_time,
      endTime: newEvent.end_time,
      isAllDay: newEvent.is_all_day,
      eventType: newEvent.event_type,
      location: newEvent.location,
      hallId: newEvent.hall_id,
      createdBy: newEvent.created_by,
      createdByName: newEvent.created_by_name,
      createdByRole: newEvent.created_by_role,
      maxAttendees: newEvent.max_attendees,
      currentAttendees: newEvent.current_attendees,
      requiresApproval: newEvent.requires_approval,
      approvalStatus: newEvent.approval_status,
      createdAt: newEvent.created_at,
      updatedAt: newEvent.updated_at
    };

    return NextResponse.json(formattedEvent, { status: 201 });
  } catch (error) {
    console.error('Exception in POST /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}