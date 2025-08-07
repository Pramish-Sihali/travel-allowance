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
      .from('task_action_items')
      .select('*')
      .eq('task_id', taskId)
      .order('serial_no', { ascending: true });

    if (error) {
      console.error('Error fetching action items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match our interface
    const transformedData = data?.map(item => ({
      id: item.id,
      serialNo: item.serial_no,
      title: item.title,
      description: item.description || '',
      assignedToId: item.assigned_to_id,
      assignedToName: item.assigned_to_name,
      priority: item.priority,
      status: item.status,
      dueDate: item.due_date || '',
      remarks: item.remarks || '',
      createdBy: item.created_by,
      createdAt: item.created_at,
      updatedBy: item.updated_by,
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
      .from('task_action_items')
      .insert({
        task_id: taskId,
        serial_no: body.serialNo,
        title: body.title,
        description: body.description,
        assigned_to_id: body.assignedToId,
        assigned_to_name: body.assignedToName,
        priority: body.priority,
        status: body.status,
        due_date: body.dueDate,
        remarks: body.remarks,
        created_by: session.user.name,
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
      title: data.title,
      description: data.description || '',
      assignedToId: data.assigned_to_id,
      assignedToName: data.assigned_to_name,
      priority: data.priority,
      status: data.status,
      dueDate: data.due_date || '',
      remarks: data.remarks || '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedBy: data.updated_by,
      updatedAt: data.updated_at
    };

    return NextResponse.json(transformedData, { status: 201 });
  } catch (error) {
    console.error('Error in action items POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}