// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized - No organization found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    // First, get tasks from same organization only
    const { data: tasksData, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('organization_id', session.user.organizationId)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks', details: tasksError }, { status: 500 });
    }

    console.log('Raw tasks data:', tasksData?.length || 0, 'tasks found');
    console.log('Organization ID from session:', session.user.organizationId);
    console.log('User ID from session:', session.user.id);
    console.log('Department filter applied:', department);

    // Then get departments from same organization
    const { data: departmentsData, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('organization_id', session.user.organizationId);

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    // Create department lookup
    const deptLookup = departmentsData.reduce((acc, dept) => {
      acc[dept.id] = dept;
      return acc;
    }, {});

    // Filter and map tasks
    let filteredTasks = tasksData;
    if (department && department !== 'all') {
      const targetDept = departmentsData.find(d => d.name === department);
      if (targetDept) {
        filteredTasks = tasksData.filter(task => task.department_id === targetDept.id);
      }
    }

    // Convert snake_case to camelCase for frontend
    const tasks = (filteredTasks || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      departmentId: task.department_id,
      departmentName: deptLookup[task.department_id]?.name || 'Unknown',
      assignedTo: task.assigned_to || [],
      assignedUserIds: task.assigned_user_ids || [],
      status: task.status,
      priority: task.priority,
      ragStatus: task.rag_status,
      dueDate: task.due_date,
      startDate: task.start_date,
      completionDate: task.completion_date,
      bottlenecks: task.bottlenecks,
      ragTakeaway: task.rag_takeaway,
      remarks: task.remarks,
      createdBy: task.created_by,
      createdByName: task.created_by_name,
      lastUpdatedBy: task.last_updated_by,
      lastUpdatedByName: task.last_updated_by_name,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    // Now fetch meeting action items assigned to the current user and convert them to task format
    const { data: meetingActionItems, error: actionItemsError } = await supabaseAdmin
      .from('meeting_minutes')
      .select(`
        id,
        content,
        responsibility,
        assigned_to,
        assigned_to_name,
        due_date,
        priority,
        completion_status,
        is_done,
        created_at,
        updated_at,
        created_by_name,
        meeting:meetings!meeting_minutes_meeting_id_fkey (
          id,
          title,
          meeting_date,
          meeting_type,
          created_by_name
        )
      `)
      .eq('is_action_item', true)
      .eq('assigned_to', session.user.id)
      .eq('organization_id', session.user.organizationId)
      .order('created_at', { ascending: false });

    // Convert meeting action items to task format
    const meetingTasks = (meetingActionItems || []).map(item => {
      const meeting = Array.isArray(item.meeting) ? item.meeting[0] : item.meeting;
      return {
        id: `meeting-${item.id}`,
        title: `[Meeting] ${item.responsibility || item.content}`,
        description: `From meeting: ${meeting?.title || 'Unknown Meeting'} (${new Date(meeting?.meeting_date || '').toLocaleDateString()})`,
      departmentId: 'meeting-actions',
      departmentName: 'Meeting Actions',
      assignedTo: [item.assigned_to_name || 'Unknown'],
      assignedUserIds: [item.assigned_to],
      status: item.completion_status === 'completed' ? 'Completed' : 
              item.completion_status === 'in_progress' ? 'In Progress' : 'Not Started',
      priority: item.priority === 'urgent' ? 'Critical' :
                item.priority === 'high' ? 'High' :
                item.priority === 'low' ? 'Low' : 'Medium',
      ragStatus: item.is_done ? 'Green' : 
                 item.completion_status === 'in_progress' ? 'Amber' : 'Unrated',
      dueDate: item.due_date,
      startDate: null,
      completionDate: item.is_done ? item.updated_at?.split('T')[0] : null,
      bottlenecks: null,
      ragTakeaway: null,
        remarks: `Meeting Action Item from: ${meeting?.title || 'Unknown Meeting'}`,
        createdBy: null,
        createdByName: item.created_by_name,
        lastUpdatedBy: null,
        lastUpdatedByName: null,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        // Add special fields to identify this as a meeting action item
        isMeetingActionItem: true,
        meetingActionItemId: item.id,
        meetingId: meeting?.id,
        meetingTitle: meeting?.title
      };
    });

    // Combine regular tasks and meeting action items
    const allTasks = [...tasks, ...meetingTasks];

    console.log('Returning tasks:', tasks.length, 'regular tasks and', meetingTasks.length, 'meeting action items');
    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Exception in GET /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      bottlenecks, 
      ragTakeaway, 
      remarks 
    } = body;

    // Validate required fields
    if (!title || !departmentId) {
      return NextResponse.json({ error: 'Title and department are required' }, { status: 400 });
    }

    const insertData = {
      title,
      description: description || '',
      department_id: departmentId,
      assigned_to: assignedTo || [],
      status: status || 'Not Started',
      priority: priority || 'Medium',
      rag_status: ragStatus || 'Unrated',
      due_date: dueDate || null,
      start_date: startDate || null,
      bottlenecks: bottlenecks || '',
      rag_takeaway: ragTakeaway || '',
      remarks: remarks || '',
      created_by: session.user.id,
      created_by_name: userData.name,
      last_updated_by: session.user.id,
      last_updated_by_name: userData.name,
      organization_id: session.user.organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newTask, error } = await supabaseAdmin
      .from('tasks')
      .insert([insertData])
      .select(`
        *,
        departments:department_id (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Convert to camelCase for response
    const formattedTask = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      departmentId: newTask.department_id,
      departmentName: newTask.departments?.name,
      assignedTo: newTask.assigned_to || [],
      assignedUserIds: newTask.assigned_user_ids || [],
      status: newTask.status,
      priority: newTask.priority,
      ragStatus: newTask.rag_status,
      dueDate: newTask.due_date,
      startDate: newTask.start_date,
      completionDate: newTask.completion_date,
      bottlenecks: newTask.bottlenecks,
      ragTakeaway: newTask.rag_takeaway,
      remarks: newTask.remarks,
      createdBy: newTask.created_by,
      createdByName: newTask.created_by_name,
      lastUpdatedBy: newTask.last_updated_by,
      lastUpdatedByName: newTask.last_updated_by_name,
      createdAt: newTask.created_at,
      updatedAt: newTask.updated_at
    };

    return NextResponse.json(formattedTask, { status: 201 });
  } catch (error) {
    console.error('Exception in POST /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}