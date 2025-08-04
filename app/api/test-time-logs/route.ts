import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Test database connection by fetching time_logs table info
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Time logs API is working',
      session: {
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role
      },
      sampleData: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received test POST request:', body);

    // Test inserting a time log
    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        task_id: body.taskId || '00000000-0000-0000-0000-000000000000', // Test UUID
        user_id: session.user.id,
        user_name: session.user.name || session.user.email,
        task_type: body.taskType || 'Desk Research',
        description: body.description || 'Test time log',
        date: body.date || new Date().toISOString().split('T')[0],
        hours_spent: body.hoursSpent || 1.0
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: 'Insert failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Time log created successfully',
      data: data
    });

  } catch (error) {
    console.error('Error in test POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}