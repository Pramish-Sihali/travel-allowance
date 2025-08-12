import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || session.user.id;
    const date = searchParams.get('date');
    const personal = searchParams.get('personal') === 'true';
    const limit = searchParams.get('limit');
    
    // Only allow users to access their own logs unless they're admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabaseAdmin
      .from('time_logs')
      .select('*')
      .eq('userid', userId)
      .eq('ispersonal', personal)
      .order('createdat', { ascending: false });

    if (date) {
      // Filter by specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('starttime', startOfDay.toISOString())
        .lte('starttime', endOfDay.toISOString());
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching time logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // No transformation needed - database now uses camelCase!
    const transformedData = data?.map(log => ({
      ...log,
      taskTitle: log.taskid ? `Task ${log.taskid}` : (log.meetingactionitemid ? `Meeting Action Item ${log.meetingactionitemid}` : null)
    })) || [];

    // If we have task_ids or meeting_action_item_ids and it's not personal logs, try to get titles separately
    if (!personal && transformedData.length > 0) {
      const taskIds = transformedData
        .map(log => log.taskid)
        .filter(id => id !== null);
      
      const meetingActionItemIds = transformedData
        .map(log => log.meetingactionitemid)
        .filter(id => id !== null);
      
      // Fetch task titles
      if (taskIds.length > 0) {
        try {
          const { data: taskData } = await supabaseAdmin
            .from('tasks')
            .select('id, title')
            .in('id', taskIds);
          
          if (taskData) {
            // Map task titles back to the logs
            transformedData.forEach(log => {
              if (log.taskid) {
                const task = taskData.find(t => t.id === log.taskid);
                if (task) {
                  log.taskTitle = task.title;
                }
              }
            });
          }
        } catch (taskError) {
          console.log('Could not fetch task titles, using fallback');
        }
      }

      // Fetch meeting action item titles
      if (meetingActionItemIds.length > 0) {
        try {
          const { data: meetingActionItemData } = await supabaseAdmin
            .from('meeting_minutes')
            .select('id, content, responsibility')
            .in('id', meetingActionItemIds);
          
          if (meetingActionItemData) {
            // Map meeting action item titles back to the logs
            transformedData.forEach(log => {
              if (log.meetingactionitemid) {
                const actionItem = meetingActionItemData.find(t => t.id === log.meetingactionitemid);
                if (actionItem) {
                  log.taskTitle = `[Meeting] ${actionItem.responsibility || actionItem.content}`;
                }
              }
            });
          }
        } catch (meetingError) {
          console.log('Could not fetch meeting action item titles, using fallback');
        }
      }
    }

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in time-logs GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      taskId,
      meetingActionItemId,
      description,
      startTime,
      endTime,
      totalDuration,
      breakDuration = 0,
      isPersonal = false
    } = body;

    if (!description || !startTime || !endTime) {
      return NextResponse.json({ 
        error: 'Missing required fields: description, startTime, endTime' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('time_logs')
      .insert({
        userid: session.user.id,
        taskid: taskId || null,
        meetingactionitemid: meetingActionItemId || null,
        description,
        starttime: startTime,
        endtime: endTime,
        totalduration: totalDuration,
        breakduration: breakDuration,
        ispersonal: isPersonal,
        organizationid: session.user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If this is linked to a task, add an update to the task
    if (taskId && !isPersonal) {
      try {
        await supabaseAdmin
          .from('task_updates')
          .insert({
            task_id: taskId,
            updated_by: session.user.id,
            update_type: 'time_log',
            new_value: `Logged ${Math.floor(totalDuration / 60)} minutes of work: ${description}`,
            organization_id: session.user.organizationId
          });
      } catch (updateError) {
        console.error('Error creating task update:', updateError);
        // Don't fail the time log creation if update fails
      }
    }

    // Update meeting action item status and add time tracking info
    if (meetingActionItemId && !isPersonal) {
      try {
        // Update the meeting action item to reflect time spent
        await supabaseAdmin
          .from('meeting_minutes')
          .update({
            actualhours: (totalDuration / 3600),
            updatedat: new Date().toISOString(),
            updatedbyname: session.user.name
          })
          .eq('id', meetingActionItemId);

        // Optionally update status to 'in_progress' if it was 'pending'
        const { data: actionItem } = await supabaseAdmin
          .from('meeting_minutes')
          .select('completionstatus')
          .eq('id', meetingActionItemId)
          .single();

        if (actionItem && actionItem.completionstatus === 'pending') {
          await supabaseAdmin
            .from('meeting_minutes')
            .update({ 
              completionstatus: 'in_progress'
            })
            .eq('id', meetingActionItemId);
        }
      } catch (updateError) {
        console.error('Error updating meeting action item:', updateError);
        // Don't fail the time log creation if update fails
      }
    }

    // No transformation needed - database returns camelCase!
    const transformedData = data;

    return NextResponse.json(transformedData, { status: 201 });
  } catch (error) {
    console.error('Error in time-logs POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}