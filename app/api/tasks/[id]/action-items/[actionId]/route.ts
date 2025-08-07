import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionId } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('task_action_items')
      .update({
        serial_no: body.serialNo,
        title: body.title,
        description: body.description,
        assigned_to_id: body.assignedToId,
        assigned_to_name: body.assignedToName,
        priority: body.priority,
        status: body.status,
        due_date: body.dueDate,
        remarks: body.remarks,
        updated_by: session.user.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', actionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating action item:', error);
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

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in action item PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionId } = await params;

    const { error } = await supabase
      .from('task_action_items')
      .delete()
      .eq('id', actionId);

    if (error) {
      console.error('Error deleting action item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in action item DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}