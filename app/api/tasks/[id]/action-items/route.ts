import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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

    const { data, error } = await supabaseAdmin
      .from('task_action_items')
      .select('*')
      .eq('taskid', taskId)
      .eq('organizationid', session.user.organizationId)
      .order('serialno', { ascending: true });

    if (error) {
      console.error('Error fetching action items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform database snake_case to camelCase for action items
    const transformedData = (data || []).map((item: any) => ({
      id: item.id,
      serialNo: item.serialno,
      title: item.title,
      description: item.description,
      assignedToId: item.assignedtoid,
      assignedToName: item.assignedtoname,
      priority: item.priority,
      status: item.status,
      dueDate: item.duedate,
      remarks: item.remarks,
      createdBy: item.createdby,
      createdAt: item.createdat,
      updatedBy: item.updatedby,
      updatedAt: item.updatedat
    }));

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

    // Validate required fields
    if (!body.title || !body.assignedToId) {
      return NextResponse.json({ error: 'Title and assignee are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('task_action_items')
      .insert({
        taskid: taskId,
        organizationid: session.user.organizationId,
        serialno: body.serialNo || 1,
        title: body.title,
        description: body.description || '',
        assignedtoid: body.assignedToId,
        assignedtoname: body.assignedToName,
        priority: body.priority || 'Medium',
        status: body.status || 'Not Started',
        duedate: body.dueDate || null,
        remarks: body.remarks || '',
        createdby: session.user.name || session.user.email || 'Unknown',
        updatedby: session.user.name || session.user.email || 'Unknown'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating action item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform database snake_case to camelCase for action item response
    const transformedData = {
      id: data.id,
      serialNo: data.serialno,
      title: data.title,
      description: data.description,
      assignedToId: data.assignedtoid,
      assignedToName: data.assignedtoname,
      priority: data.priority,
      status: data.status,
      dueDate: data.duedate,
      remarks: data.remarks,
      createdBy: data.createdby,
      createdAt: data.createdat,
      updatedBy: data.updatedby,
      updatedAt: data.updatedat
    };

    return NextResponse.json(transformedData, { status: 201 });
  } catch (error) {
    console.error('Error in action items POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}