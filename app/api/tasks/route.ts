// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session debug:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      organizationId: session?.user?.organizationId,
      userRole: session?.user?.role
    });
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      console.log('Auth failed - missing session or organizationId');
      return NextResponse.json({ error: 'Unauthorized - No organization found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    // First, get tasks from same organization only
    const { data: tasksData, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('organizationid', session.user.organizationId)
      .order('createdat', { ascending: false });

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
      .eq('organizationid', session.user.organizationId);

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
        filteredTasks = tasksData.filter(task => task.departmentid === targetDept.id);
      }
    }

    // Transform and ensure proper data structure
    const tasks = (filteredTasks || []).map(task => ({
      ...task,
      departmentName: deptLookup[task.departmentid]?.name || 'Unknown',
      assignedTo: task.assignedto && Array.isArray(task.assignedto) ? task.assignedto : [],
      assignedUserIds: task.assigneduserids && Array.isArray(task.assigneduserids) ? task.assigneduserids : []
    }));

    // Now fetch meeting action items assigned to the current user and convert them to task format
    const { data: meetingActionItems, error: actionItemsError } = await supabaseAdmin
      .from('meeting_minutes')
      .select(`
        id,
        content,
        responsibility,
        assignedto,
        assignedtoname,
        duedate,
        priority,
        completionstatus,
        isdone,
        createdat,
        updatedat,
        createdbyname,
        meeting:meetings!meeting_minutes_meeting_id_fkey (
          id,
          title,
          meetingdate,
          meetingtype,
          createdbyname
        )
      `)
      .eq('isactionitem', true)
      .eq('assignedto', session.user.id)
      .eq('organizationid', session.user.organizationId)
      .order('createdat', { ascending: false });

    // Convert meeting action items to task format
    const meetingTasks = (meetingActionItems || []).map(item => {
      const meeting = Array.isArray(item.meeting) ? item.meeting[0] : item.meeting;
      return {
        id: `meeting-${item.id}`,
        title: `[Meeting] ${item.responsibility || item.content}`,
        description: `From meeting: ${meeting?.title || 'Unknown Meeting'} (${new Date(meeting?.meetingdate || '').toLocaleDateString()})`,
      departmentid: 'meeting-actions',
      departmentName: 'Meeting Actions',
      assignedTo: [item.assignedtoname || 'Unknown'],
      assignedUserIds: [item.assignedto],
      status: item.completionstatus === 'completed' ? 'Completed' : 
              item.completionstatus === 'in_progress' ? 'In Progress' : 'Not Started',
      priority: item.priority === 'urgent' ? 'Critical' :
                item.priority === 'high' ? 'High' :
                item.priority === 'low' ? 'Low' : 'Medium',
      ragStatus: item.isdone ? 'Green' : 
                 item.completionstatus === 'in_progress' ? 'Amber' : 'Unrated',
      dueDate: item.duedate,
      startDate: null,
      completionDate: item.isdone ? item.updatedat?.split('T')[0] : null,
      bottlenecks: null,
      ragTakeaway: null,
        remarks: `Meeting Action Item from: ${meeting?.title || 'Unknown Meeting'}`,
        createdBy: null,
        createdByName: item.createdbyname,
        lastUpdatedBy: null,
        lastUpdatedByName: null,
        createdAt: item.createdat,
        updatedAt: item.updatedat,
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
      departmentid: departmentId,
      assignedto: assignedTo || [],
      status: status || 'Not Started',
      priority: priority || 'Medium',
      ragstatus: ragStatus || 'Unrated',
      duedate: dueDate || null,
      startdate: startDate || null,
      bottlenecks: bottlenecks || '',
      ragtakeaway: ragTakeaway || '',
      remarks: remarks || '',
      createdby: session.user.id,
      createdbyname: userData.name,
      lastupdatedby: session.user.id,
      lastupdatedbyname: userData.name,
      organizationid: session.user.organizationId,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };

    const { data: newTask, error } = await supabaseAdmin
      .from('tasks')
      .insert([insertData])
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
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // No transformation needed - database returns camelCase!
    const formattedTask = {
      ...newTask,
      departmentName: newTask.departments?.name
    };

    return NextResponse.json(formattedTask, { status: 201 });
  } catch (error) {
    console.error('Exception in POST /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}