import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: taskId } = await params;

    // Fetch time logs for the task (supports both old and new schema)
    const { data, error } = await supabaseAdmin
      .from('time_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching time logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time logs' },
        { status: 500 }
      );
    }

    // Transform to camelCase and handle both old and new schema
    const timeLogs = data.map(log => ({
      id: log.id,
      taskId: log.task_id,
      userId: log.user_id,
      userName: log.user_name || 'Unknown',
      taskType: log.task_type || 'General',
      description: log.description,
      date: log.date || (log.start_time ? log.start_time.split('T')[0] : null),
      startTime: log.start_time,
      endTime: log.end_time,
      totalDuration: log.total_duration,
      breakDuration: log.break_duration,
      hoursSpent: log.hours_spent || (log.total_duration ? Math.round((log.total_duration / 3600) * 100) / 100 : 0),
      isPersonal: log.is_personal || false,
      createdAt: log.created_at,
      updatedAt: log.updated_at
    }));

    return NextResponse.json(timeLogs);
  } catch (error) {
    console.error('Error in time logs GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: taskId } = await params;
    const body = await request.json();
    const { 
      taskType, 
      description, 
      date, 
      hoursSpent,
      startTime,
      endTime,
      totalDuration,
      breakDuration,
      isPersonal = false
    } = body;

    // Support both old and new formats
    const isNewFormat = startTime && endTime;
    
    if (isNewFormat) {
      // New format validation
      if (!description || !startTime || !endTime) {
        return NextResponse.json(
          { error: 'Missing required fields: description, startTime, endTime' },
          { status: 400 }
        );
      }
    } else {
      // Old format validation
      if (!taskType || !description || !date || !hoursSpent) {
        return NextResponse.json(
          { error: 'Missing required fields: taskType, description, date, hoursSpent' },
          { status: 400 }
        );
      }

      // Validate task type for old format
      const validTaskTypes = [
        'Desk Research',
        'Field Visit',
        'Report Writing',
        'Interview/Consultation Meetings',
        'Visuals and Designing',
        'Data Analysis/Interpretation',
        'Finance/Administrative Tasks'
      ];

      if (!validTaskTypes.includes(taskType)) {
        return NextResponse.json(
          { error: 'Invalid task type' },
          { status: 400 }
        );
      }

      // Validate hours spent for old format
      if (typeof hoursSpent !== 'number' || hoursSpent <= 0 || hoursSpent > 24) {
        return NextResponse.json(
          { error: 'Hours spent must be between 0.1 and 24' },
          { status: 400 }
        );
      }
    }

    // Check if task exists
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .single();

    if (taskError || !taskData) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Prepare insert data based on format
    let insertData: any = {
      task_id: taskId,
      user_id: session.user.id,
      description,
      organization_id: session.user.organizationId,
      is_personal: isPersonal
    };

    if (isNewFormat) {
      // New format - use start_time/end_time
      insertData = {
        ...insertData,
        start_time: startTime,
        end_time: endTime,
        total_duration: totalDuration || 0,
        break_duration: breakDuration || 0
      };
    } else {
      // Old format - convert to new format
      const startDateTime = new Date(`${date}T09:00:00`);
      const endDateTime = new Date(startDateTime.getTime() + (hoursSpent * 60 * 60 * 1000));
      
      insertData = {
        ...insertData,
        user_name: session.user.name || session.user.email,
        task_type: taskType,
        date: date,
        hours_spent: hoursSpent,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        total_duration: Math.round(hoursSpent * 3600),
        break_duration: 0
      };
    }

    // Insert time log
    const { data, error } = await supabaseAdmin
      .from('time_logs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating time log:', error);
      return NextResponse.json(
        { error: 'Failed to create time log' },
        { status: 500 }
      );
    }

    // Create task update
    try {
      await supabaseAdmin
        .from('task_updates')
        .insert({
          task_id: taskId,
          user_id: session.user.id,
          update_text: `Logged ${data.hours_spent || Math.floor(data.total_duration / 3600)} hours of work: ${description}`,
          update_type: 'time_log',
          updated_by: session.user.id,
          updated_by_name: session.user.name || session.user.email,
          organization_id: session.user.organizationId
        });
    } catch (updateError) {
      console.error('Error creating task update:', updateError);
      // Don't fail the time log creation if update fails
    }

    // Transform response to camelCase
    const timeLog = {
      id: data.id,
      taskId: data.task_id,
      userId: data.user_id,
      userName: data.user_name || session.user.name || session.user.email,
      taskType: data.task_type,
      description: data.description,
      date: data.date || (data.start_time ? data.start_time.split('T')[0] : null),
      startTime: data.start_time,
      endTime: data.end_time,
      totalDuration: data.total_duration,
      breakDuration: data.break_duration,
      hoursSpent: data.hours_spent || (data.total_duration ? Math.round((data.total_duration / 3600) * 100) / 100 : 0),
      isPersonal: data.is_personal,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json(timeLog, { status: 201 });
  } catch (error) {
    console.error('Error in time logs POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}