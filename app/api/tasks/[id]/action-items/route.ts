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

    const taskId = (await params).id;

    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('*')
      .eq('task_id', taskId)
      .eq('is_action_item', true)
      .order('serial_no', { ascending: true });

    if (error) {
      console.error('Error fetching action items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match our interface
    const transformedData = data?.map(item => ({
      id: item.id,
      serialNo: item.serial_no,
      title: item.responsibility || item.content, // Use responsibility or content as title
      description: item.content || '',
      assignedToId: item.assigned_to,
      assignedToName: item.assigned_to_name,
      priority: item.priority,
      status: item.completion_status || 'pending',
      dueDate: item.due_date || '',
      remarks: item.deadline_notes || '',
      createdBy: item.created_by_name,
      createdAt: item.created_at,
      updatedBy: item.updated_by_name,
      updatedAt: item.updated_at
    })) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in action items GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = (await params).id;
    const body = await request.json();

    const { data, error } = await supabase
      .from('meeting_minutes')
      .insert({
        task_id: taskId,
        serial_no: body.serialNo,
        content: body.description || body.title,
        responsibility: body.title,
        assigned_to: body.assignedToId,
        assigned_to_name: body.assignedToName,
        priority: body.priority,
        completion_status: body.status || 'pending',
        due_date: body.dueDate,
        deadline_notes: body.remarks,
        is_action_item: true,
        created_by_name: session.user.name,
        organization_id: session.user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating action item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the response
    const transformedData = {
      id: data.id,
      serialNo: data.serial_no,
      title: data.responsibility || data.content,
      description: data.content || '',
      assignedToId: data.assigned_to,
      assignedToName: data.assigned_to_name,
      priority: data.priority,
      status: data.completion_status || 'pending',
      dueDate: data.due_date || '',
      remarks: data.deadline_notes || '',
      createdBy: data.created_by_name,
      createdAt: data.created_at,
      updatedBy: data.updated_by_name,
      updatedAt: data.updated_at
    };

    return NextResponse.json(transformedData, { status: 201 });
  } catch (error) {
    console.error('Error in action items POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}