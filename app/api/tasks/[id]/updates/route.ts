// app/api/tasks/[id]/updates/route.ts

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

    const { id } = await params;
    
    const { data, error } = await supabaseAdmin
      .from('task_updates')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task updates:', error);
      return NextResponse.json({ error: 'Failed to fetch task updates' }, { status: 500 });
    }

    // Convert snake_case to camelCase for frontend
    const updates = data.map(update => ({
      id: update.id,
      taskId: update.task_id,
      updateType: update.update_type,
      oldValue: update.old_value,
      newValue: update.new_value,
      remarks: update.remarks,
      updatedBy: update.updated_by,
      updatedByName: update.updated_by_name,
      createdAt: update.created_at
    }));

    return NextResponse.json(updates);
  } catch (error) {
    console.error('Exception in GET /api/tasks/[id]/updates:', error);
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

    // Get user information
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { updateType, oldValue, newValue, remarks } = body;

    // Validate required fields
    if (!updateType || !remarks) {
      return NextResponse.json({ error: 'Update type and remarks are required' }, { status: 400 });
    }

    const insertData = {
      task_id: id,
      update_type: updateType,
      old_value: oldValue || null,
      new_value: newValue || null,
      remarks,
      updated_by: session.user.id,
      updated_by_name: userData.name,
      created_at: new Date().toISOString()
    };

    const { data: newUpdate, error } = await supabaseAdmin
      .from('task_updates')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating task update:', error);
      return NextResponse.json({ error: 'Failed to create task update' }, { status: 500 });
    }

    // Convert to camelCase for response
    const formattedUpdate = {
      id: newUpdate.id,
      taskId: newUpdate.task_id,
      updateType: newUpdate.update_type,
      oldValue: newUpdate.old_value,
      newValue: newUpdate.new_value,
      remarks: newUpdate.remarks,
      updatedBy: newUpdate.updated_by,
      updatedByName: newUpdate.updated_by_name,
      createdAt: newUpdate.created_at
    };

    return NextResponse.json(formattedUpdate, { status: 201 });
  } catch (error) {
    console.error('Exception in POST /api/tasks/[id]/updates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}