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
    const employeeId = searchParams.get('employeeId') || session.user.id;
    const organizationId = session.user.organizationId;

    // Fetch action items assigned to the employee
    let query = supabaseAdmin
      .from('meeting_minutes')
      .select(`
        id,
        content,
        responsibility,
        serial_no,
        is_action_item,
        completion_status,
        assigned_to,
        assigned_to_name,
        due_date,
        priority,
        remarks,
        flags,
        is_done,
        created_at,
        updated_at,
        meeting:meetings!meeting_minutes_meeting_id_fkey (
          id,
          title,
          meeting_date,
          meeting_time,
          location,
          meeting_type,
          priority,
          created_by_name
        )
      `)
      .eq('is_action_item', true)
      .eq('assigned_to', employeeId);

    // Only add organization filter if organizationId is valid
    if (organizationId && organizationId !== 'undefined') {
      query = query.eq('organization_id', organizationId);
    } else {
      query = query.is('organization_id', null);
    }

    const { data: actionItems, error: actionItemsError } = await query
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (actionItemsError) {
      console.error('Error fetching action items:', actionItemsError);
      return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      totalActionItems: actionItems?.length || 0,
      pendingActionItems: actionItems?.filter(item => item.completion_status === 'pending').length || 0,
      completedActionItems: actionItems?.filter(item => item.completion_status === 'completed').length || 0,
      overdueActionItems: 0,
      dueTodayActionItems: 0
    };

    const currentDate = new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    actionItems?.forEach(item => {
      if (item.due_date && item.completion_status !== 'completed') {
        const dueDate = new Date(item.due_date);
        
        // Count overdue items
        if (dueDate < currentDate) {
          stats.overdueActionItems++;
        }
        
        // Count items due today
        if (dueDate.toDateString() === currentDate.toDateString()) {
          stats.dueTodayActionItems++;
        }
      }
    });

    return NextResponse.json({
      actionItems: actionItems || [],
      stats
    });

  } catch (error) {
    console.error('Error in meeting action items GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { actionItemId, status, remarks } = data;

    if (!actionItemId) {
      return NextResponse.json({ error: 'Action item ID is required' }, { status: 400 });
    }

    // Update the action item status
    const updateData: any = {
      completion_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.is_done = true;
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = session.user.id;
      updateData.completed_by_name = session.user.name;
    } else if (status === 'in_progress') {
      updateData.is_done = false;
      updateData.started_at = new Date().toISOString();
      updateData.started_by = session.user.id;
    } else if (status === 'pending') {
      updateData.is_done = false;
    }

    if (remarks) {
      updateData.remarks = remarks;
    }

    const { error } = await supabaseAdmin
      .from('meeting_minutes')
      .update(updateData)
      .eq('id', actionItemId);

    if (error) {
      console.error('Error updating action item:', error);
      return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Action item updated successfully' });

  } catch (error) {
    console.error('Error in meeting action items PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}