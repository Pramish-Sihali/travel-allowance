import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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

    let query = supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_personal', personal)
      .order('created_at', { ascending: false });

    if (date) {
      // Filter by specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching time logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match our interface
    const transformedData = data?.map(log => ({
      id: log.id,
      taskId: log.task_id,
      meetingActionItemId: log.meeting_action_item_id,
      userId: log.user_id,
      description: log.description,
      startTime: log.start_time,
      endTime: log.end_time,
      totalDuration: log.total_duration,
      breakDuration: log.break_duration || 0,
      isPersonal: log.is_personal,
      taskTitle: log.task_id ? `Task ${log.task_id}` : (log.meeting_action_item_id ? `Meeting Action Item ${log.meeting_action_item_id}` : null),
      createdAt: log.created_at
    })) || [];

    // If we have task_ids or meeting_action_item_ids and it's not personal logs, try to get titles separately
    if (!personal && transformedData.length > 0) {
      const taskIds = transformedData
        .map(log => log.taskId)
        .filter(id => id !== null);
      
      const meetingActionItemIds = transformedData
        .map(log => log.meetingActionItemId)
        .filter(id => id !== null);
      
      // Fetch task titles
      if (taskIds.length > 0) {
        try {
          const { data: taskData } = await supabase
            .from('tasks')
            .select('id, title')
            .in('id', taskIds);
          
          if (taskData) {
            // Map task titles back to the logs
            transformedData.forEach(log => {
              if (log.taskId) {
                const task = taskData.find(t => t.id === log.taskId);
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
          const { data: meetingActionItemData } = await supabase
            .from('meeting_minutes')
            .select('id, content, responsibility')
            .in('id', meetingActionItemIds);
          
          if (meetingActionItemData) {
            // Map meeting action item titles back to the logs
            transformedData.forEach(log => {
              if (log.meetingActionItemId) {
                const actionItem = meetingActionItemData.find(t => t.id === log.meetingActionItemId);
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

    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: session.user.id,
        task_id: taskId || null,
        meeting_action_item_id: meetingActionItemId || null,
        description,
        start_time: startTime,
        end_time: endTime,
        total_duration: totalDuration,
        break_duration: breakDuration,
        is_personal: isPersonal,
        organization_id: session.user.organizationId
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
        await supabase
          .from('task_updates')
          .insert({
            task_id: taskId,
            user_id: session.user.id,
            update_text: `Logged ${Math.floor(totalDuration / 60)} minutes of work: ${description}`,
            update_type: 'time_log',
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
        await supabase
          .from('meeting_minutes')
          .update({
            actual_hours: (totalDuration / 3600), // Convert seconds to hours
            updated_at: new Date().toISOString(),
            updated_by_name: session.user.name
          })
          .eq('id', meetingActionItemId);

        // Optionally update status to 'in_progress' if it was 'pending'
        const { data: actionItem } = await supabase
          .from('meeting_minutes')
          .select('completion_status')
          .eq('id', meetingActionItemId)
          .single();

        if (actionItem && actionItem.completion_status === 'pending') {
          await supabase
            .from('meeting_minutes')
            .update({ 
              completion_status: 'in_progress',
              started_at: new Date().toISOString(),
              started_by: session.user.id
            })
            .eq('id', meetingActionItemId);
        }
      } catch (updateError) {
        console.error('Error updating meeting action item:', updateError);
        // Don't fail the time log creation if update fails
      }
    }

    const transformedData = {
      id: data.id,
      taskId: data.task_id,
      userId: data.user_id,
      description: data.description,
      startTime: data.start_time,
      endTime: data.end_time,
      totalDuration: data.total_duration,
      breakDuration: data.break_duration,
      isPersonal: data.is_personal,
      createdAt: data.created_at
    };

    return NextResponse.json(transformedData, { status: 201 });
  } catch (error) {
    console.error('Error in time-logs POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}