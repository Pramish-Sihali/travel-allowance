import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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

    const { data, error } = await supabaseAdmin
      .from('task_action_items')
      .update({
        serialno: body.serialNo,
        title: body.title,
        description: body.description,
        assignedtoid: body.assignedToId,
        assignedtoname: body.assignedToName,
        priority: body.priority,
        status: body.status,
        duedate: body.dueDate,
        remarks: body.remarks,
        updatedby: session.user.name,
        updatedat: new Date().toISOString()
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
      serialNo: data.serialno,
      title: data.title,
      description: data.description || '',
      assignedToId: data.assignedtoid,
      assignedToName: data.assignedtoname,
      priority: data.priority,
      status: data.status,
      dueDate: data.duedate || '',
      remarks: data.remarks || '',
      createdBy: data.createdby,
      createdAt: data.createdat,
      updatedBy: data.updatedby,
      updatedAt: data.updatedat
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

    const { error } = await supabaseAdmin
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