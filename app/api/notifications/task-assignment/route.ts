import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { assignedUserIds, taskTitle, taskId, assignedBy } = body;

    if (!assignedUserIds || !Array.isArray(assignedUserIds) || !taskTitle || !taskId) {
      return NextResponse.json({ 
        error: 'Missing required fields: assignedUserIds, taskTitle, taskId' 
      }, { status: 400 });
    }

    // Create notifications for each assigned user
    const notifications = assignedUserIds.map(userId => ({
      user_id: userId,
      title: 'New Project Assignment',
      message: `You have been assigned to project: ${taskTitle}`,
      type: 'info',
      read: false,
      organization_id: session.user.organizationId,
      metadata: {
        taskId,
        projectId: taskId,
        actionUrl: `/tasks/${taskId}`,
        assignedBy: assignedBy || session.user.name
      }
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('Error creating task assignment notifications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Notifications sent successfully',
      count: data?.length || 0
    }, { status: 201 });

  } catch (error) {
    console.error('Error in task-assignment notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}