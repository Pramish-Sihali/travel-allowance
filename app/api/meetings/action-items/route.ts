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
        serialno,
        isactionitem,
        completionstatus,
        assignedto,
        assignedtoname,
        duedate,
        priority,
        remarks,
        flags,
        isdone,
        createdat,
        updatedat,
        meeting:meetings!meeting_minutes_meeting_id_fkey (
          id,
          title,
          meetingdate,
          meetingtime,
          location,
          meetingtype,
          priority,
          createdbyname
        )
      `)
      .eq('isactionitem', true)
      .eq('assignedto', employeeId);

    // Only add organization filter if organizationId is valid
    if (organizationId && organizationId !== 'undefined') {
      query = query.eq('organizationid', organizationId);
    } else {
      query = query.is('organizationid', null);
    }

    const { data: actionItems, error: actionItemsError } = await query
      .order('duedate', { ascending: true, nullsFirst: false })
      .order('createdat', { ascending: false });

    if (actionItemsError) {
      console.error('Error fetching action items:', actionItemsError);
      return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      totalActionItems: actionItems?.length || 0,
      pendingActionItems: actionItems?.filter(item => item.completionstatus === 'pending').length || 0,
      completedActionItems: actionItems?.filter(item => item.completionstatus === 'completed').length || 0,
      overdueActionItems: 0,
      dueTodayActionItems: 0
    };

    const currentDate = new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    actionItems?.forEach(item => {
      if (item.duedate && item.completionstatus !== 'completed') {
        const dueDate = new Date(item.duedate);
        
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
      completionstatus: status,
      updatedat: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.isdone = true;
      updateData.completedat = new Date().toISOString();
      updateData.completedby = session.user.id;
      updateData.completedbyname = session.user.name;
    } else if (status === 'in_progress') {
      updateData.isdone = false;
    } else if (status === 'pending') {
      updateData.isdone = false;
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