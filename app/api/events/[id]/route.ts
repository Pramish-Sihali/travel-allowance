// app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Convert to camelCase
    const event = {
      id: data.id,
      title: data.title,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      startTime: data.start_time,
      endTime: data.end_time,
      isAllDay: data.is_all_day,
      eventType: data.event_type,
      location: data.location,
      hallId: data.hall_id,
      createdBy: data.created_by,
      createdByName: data.created_by_name,
      createdByRole: data.created_by_role,
      maxAttendees: data.max_attendees,
      currentAttendees: data.current_attendees,
      requiresApproval: data.requires_approval,
      approvalStatus: data.approval_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json(event);
  } catch (error) {
    console.error('Exception in GET /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user information and event details for permission check
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    
    // Get the event to check ownership and type
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('created_by, event_type')
      .eq('id', id)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions: user can edit their own events, or approvers can edit any event
    const isOwner = eventData.created_by === session.user.id;
    const isApprover = ['approver', 'admin'].includes(userData.role);
    
    if (!isOwner && !isApprover) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, startDate, endDate, startTime, endTime, isAllDay, eventType, location, maxAttendees, hallId } = body;

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Title, start date, and end date are required' }, { status: 400 });
    }

    // Check if the user is trying to change event type to one that requires approver role
    const approverOnlyEvents = ['company_meeting', 'training', 'holiday', 'deadline', 'announcement'];
    if (eventType && approverOnlyEvents.includes(eventType) && !isApprover) {
      return NextResponse.json({ 
        error: `Only approvers can create ${eventType.replace('_', ' ')} events` 
      }, { status: 403 });
    }

    const updateData = {
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
      max_attendees: maxAttendees || null,
      updated_at: new Date().toISOString()
    };
    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    // Convert to camelCase for response
    const formattedEvent = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      startDate: updatedEvent.start_date,
      endDate: updatedEvent.end_date,
      startTime: updatedEvent.start_time,
      endTime: updatedEvent.end_time,
      isAllDay: updatedEvent.is_all_day,
      eventType: updatedEvent.event_type,
      location: updatedEvent.location,
      hallId: updatedEvent.hall_id,
      createdBy: updatedEvent.created_by,
      createdByName: updatedEvent.created_by_name,
      createdByRole: updatedEvent.created_by_role,
      maxAttendees: updatedEvent.max_attendees,
      currentAttendees: updatedEvent.current_attendees,
      requiresApproval: updatedEvent.requires_approval,
      approvalStatus: updatedEvent.approval_status,
      createdAt: updatedEvent.created_at,
      updatedAt: updatedEvent.updated_at
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Exception in PUT /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user information and event details for permission check
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    
    // Get the event to check ownership
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', id)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions: user can delete their own events, or approvers can delete any event
    const isOwner = eventData.created_by === session.user.id;
    const isApprover = ['approver', 'admin'].includes(userData.role);
    
    if (!isOwner && !isApprover) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Exception in DELETE /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}