// app/api/tasks/[id]/route.ts

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
      .from('tasks')
      .select(`
        *,
        departments:departmentid (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Convert to camelCase
    const task = {
      id: data.id,
      title: data.title,
      description: data.description,
      departmentId: data.departmentid,
      departmentName: data.departments?.name,
      assignedTo: data.assignedto || [],
      assignedUserIds: data.assigneduserids || [],
      status: data.status,
      priority: data.priority,
      ragStatus: data.ragstatus,
      dueDate: data.duedate,
      startDate: data.startdate,
      completionDate: data.completiondate,
      bottlenecks: data.bottlenecks,
      ragTakeaway: data.ragtakeaway,
      remarks: data.remarks,
      createdBy: data.createdby,
      createdByName: data.createdbyname,
      lastUpdatedBy: data.lastupdatedby,
      lastUpdatedByName: data.lastupdatedbyname,
      createdAt: data.createdat,
      updatedAt: data.updatedat
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error('Exception in GET /api/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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
      .select('role, name')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    
    // Get the task to check permissions
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('createdby, status')
      .eq('id', id)
      .single();

    if (taskError || !taskData) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check permissions: user can edit their own tasks, or admins/approvers can edit any task
    const isOwner = taskData.createdby === session.user.id;
    const isApprover = ['approver', 'admin'].includes(userData.role);
    
    if (!isOwner && !isApprover) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      departmentId, 
      assignedTo, 
      status, 
      priority, 
      ragStatus, 
      dueDate, 
      startDate, 
      completionDate,
      bottlenecks, 
      ragTakeaway, 
      remarks,
      updateRemark 
    } = body;

    // Validate required fields
    if (!title || !departmentId) {
      return NextResponse.json({ error: 'Title and department are required' }, { status: 400 });
    }

    const updateData = {
      title,
      description: description || '',
      departmentid: departmentId,
      assignedto: assignedTo || [],
      status: status || 'Not Started',
      priority: priority || 'Medium',
      ragstatus: ragStatus || 'Unrated',
      duedate: dueDate || null,
      startdate: startDate || null,
      completiondate: status === 'Completed' ? (completionDate || new Date().toISOString().split('T')[0]) : null,
      bottlenecks: bottlenecks || '',
      ragtakeaway: ragTakeaway || '',
      remarks: remarks || '',
      lastupdatedby: session.user.id,
      lastupdatedbyname: userData.name,
      updatedat: new Date().toISOString()
    };

    const { data: updatedTask, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        departments:departmentid (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // If status changed or there's an update remark, create a task update record
    if (taskData.status !== status || updateRemark) {
      const updateRecord = {
        task_id: id,
        update_type: taskData.status !== status ? 'status_change' : 'remark',
        old_value: taskData.status !== status ? taskData.status : null,
        new_value: taskData.status !== status ? status : null,
        remarks: updateRemark || '',
        updated_by: session.user.id,
        updated_by_name: userData.name,
        created_at: new Date().toISOString()
      };

      await supabaseAdmin
        .from('task_updates')
        .insert([updateRecord]);
    }

    // Convert to camelCase for response
    const formattedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      departmentId: updatedTask.department_id,
      departmentName: updatedTask.departments?.name,
      assignedTo: updatedTask.assigned_to || [],
      assignedUserIds: updatedTask.assigned_user_ids || [],
      status: updatedTask.status,
      priority: updatedTask.priority,
      ragStatus: updatedTask.rag_status,
      dueDate: updatedTask.due_date,
      startDate: updatedTask.start_date,
      completionDate: updatedTask.completion_date,
      bottlenecks: updatedTask.bottlenecks,
      ragTakeaway: updatedTask.rag_takeaway,
      remarks: updatedTask.remarks,
      createdBy: updatedTask.created_by,
      createdByName: updatedTask.created_by_name,
      lastUpdatedBy: updatedTask.last_updated_by,
      lastUpdatedByName: updatedTask.last_updated_by_name,
      createdAt: updatedTask.created_at,
      updatedAt: updatedTask.updated_at
    };

    return NextResponse.json(formattedTask);
  } catch (error) {
    console.error('Exception in PUT /api/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
      .select('role, name')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    
    // Get the task to check permissions
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('created_by, status, assigned_user_ids, assigned_to')
      .eq('id', id)
      .single();

    if (taskError || !taskData) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check permissions: user can edit their own tasks, assigned tasks, or admins/approvers can edit any task
    const isOwner = taskData.created_by === session.user.id;
    const isAssigned = taskData.assigned_user_ids?.includes(session.user.id) || 
                      taskData.assigned_to?.includes(session.user.name);
    const isApprover = ['approver', 'admin'].includes(userData.role);
    
    if (!isOwner && !isAssigned && !isApprover) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { status, completionDate, updateRemark } = body;

    const updateData: any = {
      last_updated_by: session.user.id,
      last_updated_by_name: userData.name,
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === 'Completed') {
        updateData.completion_date = completionDate || new Date().toISOString().split('T')[0];
      }
    }

    const { data: updatedTask, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Create a task update record
    if (taskData.status !== status || updateRemark) {
      const updateRecord = {
        task_id: id,
        user_id: session.user.id,
        update_type: taskData.status !== status ? 'status_change' : 'remark',
        old_value: taskData.status !== status ? taskData.status : null,
        new_value: taskData.status !== status ? status : null,
        update_text: updateRemark || `Status changed from ${taskData.status} to ${status}`,
        updated_by: session.user.id,
        updated_by_name: userData.name,
        organization_id: session.user.organizationId,
        created_at: new Date().toISOString()
      };

      await supabaseAdmin
        .from('task_updates')
        .insert([updateRecord]);
    }

    return NextResponse.json({
      id: updatedTask.id,
      status: updatedTask.status,
      completionDate: updatedTask.completion_date,
      updatedAt: updatedTask.updated_at
    });
  } catch (error) {
    console.error('Exception in PATCH /api/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    
    // Get the task to check ownership
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('created_by')
      .eq('id', id)
      .single();

    if (taskError || !taskData) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check permissions: user can delete their own tasks, or admins can delete any task
    const isOwner = taskData.created_by === session.user.id;
    const isAdmin = userData.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Exception in DELETE /api/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}