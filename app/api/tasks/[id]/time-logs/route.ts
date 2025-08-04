import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // Fetch time logs for the task
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching time logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time logs' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const timeLogs = data.map(log => ({
      id: log.id,
      taskId: log.task_id,
      userId: log.user_id,
      userName: log.user_name,
      taskType: log.task_type,
      description: log.description,
      date: log.date,
      hoursSpent: log.hours_spent,
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
    const { taskType, description, date, hoursSpent } = body;

    // Validate required fields
    if (!taskType || !description || !date || !hoursSpent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate task type
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

    // Validate hours spent
    if (typeof hoursSpent !== 'number' || hoursSpent <= 0 || hoursSpent > 24) {
      return NextResponse.json(
        { error: 'Hours spent must be between 0.1 and 24' },
        { status: 400 }
      );
    }

    // Check if task exists
    const { data: taskData, error: taskError } = await supabase
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

    // Insert time log
    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        task_id: taskId,
        user_id: session.user.id,
        user_name: session.user.name || session.user.email,
        task_type: taskType,
        description,
        date,
        hours_spent: hoursSpent
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time log:', error);
      return NextResponse.json(
        { error: 'Failed to create time log' },
        { status: 500 }
      );
    }

    // Transform response to camelCase
    const timeLog = {
      id: data.id,
      taskId: data.task_id,
      userId: data.user_id,
      userName: data.user_name,
      taskType: data.task_type,
      description: data.description,
      date: data.date,
      hoursSpent: data.hours_spent,
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