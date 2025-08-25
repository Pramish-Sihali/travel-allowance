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
    const userId = searchParams.get('userId') || session.user.id;
    const organizationId = session.user.organizationId;

    // First, get all meetings with action items where the user is assigned
    const { data: meetingMinutes, error: minutesError } = await supabaseAdmin
      .from('meeting_minutes')
      .select(`
        id,
        meeting_id,
        content,
        assigned_to,
        assigned_to_name,
        due_date,
        due_time,
        priority,
        completion_status,
        completion_percentage,
        is_done,
        flags,
        remarks,
        deadline_notes,
        completed_by_name,
        completed_at,
        created_at,
        updated_at,
        meetings!inner(
          id,
          title,
          meeting_date,
          meeting_time,
          status,
          created_by_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('assigned_to', userId)
      .eq('is_action_item', true)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (minutesError) {
      console.error('Error fetching user follow-ups:', minutesError);
      return NextResponse.json({ error: minutesError.message }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedData = (meetingMinutes || []).map((item: any) => ({
      id: item.id,
      meeting_id: item.meeting_id,
      meeting_title: item.meetings?.title || 'N/A',
      meeting_date: item.meetings?.meeting_date || '',
      meeting_time: item.meetings?.meeting_time || '',
      meeting_status: item.meetings?.status || 'unknown',
      meeting_created_by: item.meetings?.created_by_name || 'N/A',
      responsibility: item.content,
      assigned_to_name: item.assigned_to_name,
      deadline: item.due_date,
      deadline_time: item.due_time,
      priority: item.priority,
      remarks: item.remarks || item.deadline_notes || '',
      is_done: item.is_done !== null ? item.is_done : (item.completion_status === 'completed'),
      completion_status: item.completion_status,
      completion_percentage: item.completion_percentage || 0,
      flags: item.flags || (item.priority ? `Priority: ${item.priority}` : ''),
      completed_by: item.completed_by_name,
      completed_at: item.completed_at,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    // Calculate statistics
    const stats = {
      total: transformedData.length,
      completed: transformedData.filter(item => item.is_done).length,
      pending: transformedData.filter(item => !item.is_done).length,
      overdue: transformedData.filter(item => 
        !item.is_done && 
        item.deadline && 
        new Date(item.deadline) < new Date()
      ).length
    };

    return NextResponse.json({
      success: true,
      actionItems: transformedData,
      stats
    });

  } catch (error) {
    console.error('Error in user follow-ups GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update action item status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { is_done, completion_status, completion_percentage } = body;

    const updateData: any = {
      is_done: is_done,
      completion_status: completion_status || (is_done ? 'completed' : 'pending'),
      completion_percentage: completion_percentage || (is_done ? 100 : 0),
      updated_at: new Date().toISOString(),
    };

    if (is_done) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by_name = session.user.name || session.user.email;
    } else {
      updateData.completed_at = null;
      updateData.completed_by_name = null;
    }

    const { data, error } = await supabaseAdmin
      .from('meeting_minutes')
      .update(updateData)
      .eq('id', itemId)
      .eq('organization_id', session.user.organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating follow-up item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data,
      message: `Action item marked as ${is_done ? 'completed' : 'pending'}`
    });

  } catch (error) {
    console.error('Error in user follow-ups PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}