// lib/db-simplified.ts
// Simplified database helpers - no more field transformations needed!

import { supabase } from './supabase';
import { TravelRequest, ExpenseItem, Receipt, Notification, TimeLog, TaskActionItem } from '@/types';
import { UserRole } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid';

// User functions
export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) return null;
  return data;
};

export const getUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data;
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) return [];
  return data;
};

export const getUsersByRole = async (role: UserRole, organizationId?: string) => {
  let query = supabase
    .from('users')
    .select('*')
    .eq('role', role);
  
  if (organizationId) {
    query = query.eq('organizationid', organizationId);
  }
  
  const { data, error } = await query;
  if (error) return [];
  return data;
};

// Travel Requests Functions - SIMPLIFIED!
export const getAllTravelRequests = async (organizationId?: string) => {
  let query = supabase
    .from('travel_requests')
    .select('*')
    .order('createdat', { ascending: false });
  
  if (organizationId) {
    query = query.eq('organizationid', organizationId);
  }
  
  const { data, error } = await query;
  if (error) return [];
  return data; // Direct return - no transformation needed!
};

export const getTravelRequestsByEmployeeId = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('employeeid', employeeId)
    .order('createdat', { ascending: false });
  
  if (error) return [];
  return data; // Direct return!
};

export const getTravelRequestById = async (id: string): Promise<TravelRequest | null> => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching travel request:', error);
    return null;
  }
  
  return data; // Direct return - fields already match!
};

export const createTravelRequest = async (data: Omit<TravelRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<TravelRequest> => {
  // No field transformation needed - just pass data directly!
  const dbData = {
    id: uuidv4(),
    ...data,
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString()
  };
  
  const { data: newRequest, error } = await supabase
    .from('travel_requests')
    .insert([dbData])
    .select()
    .single();

  if (error) {
    console.error('Error creating travel request:', error);
    throw error;
  }
  
  // Create notifications
  try {
    await createNotification({
      userId: data.employeeId,
      requestId: newRequest.id,
      message: `Your ${data.requestType} travel request has been submitted and is awaiting approval.`,
    });
    
    await createNotification({
      userId: data.approverId,
      requestId: newRequest.id,
      message: `A new ${data.requestType} travel request is waiting for your approval`,
    });
  } catch (notificationError) {
    console.error('Error creating notifications:', notificationError);
  }

  return newRequest; // Direct return!
};

export const updateTravelRequestStatus = async (id: string, status: TravelRequest['status'], additionalData = {}) => {
  const updateData = { 
    status, 
    updatedat: new Date().toISOString(),
    ...additionalData
  };
  
  const { data: updatedRequest, error } = await supabase
    .from('travel_requests')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    console.error('Error updating travel request:', error);
    return null;
  }
  
  return updatedRequest; // Direct return!
};

// Notifications - SIMPLIFIED!
export const getNotificationsByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('userid', userId)
    .order('createdat', { ascending: false });
  
  if (error) return [];
  return data; // Direct return - fields already match!
};

export const createNotification = async (data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
  const { data: newNotification, error } = await supabase
    .from('notifications')
    .insert([{
      ...data,
      isread: false,
      createdat: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
  
  return newNotification; // Direct return!
};

export const markNotificationAsRead = async (id: string) => {
  const { data: updatedNotification, error } = await supabase
    .from('notifications')
    .update({ isread: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) return null;
  return updatedNotification; // Direct return!
};

// Expense Items - SIMPLIFIED!
export const getExpenseItemsByRequestId = async (requestId: string) => {
  const { data, error } = await supabase
    .from('expense_items')
    .select('*')
    .eq('requestid', requestId);
  
  if (error) return [];
  return data; // Direct return!
};

export const createExpenseItem = async (data: Omit<ExpenseItem, 'id'>) => {
  const { data: newItem, error } = await supabase
    .from('expense_items')
    .insert([data])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating expense item:', error);
    throw error;
  }
  
  return newItem; // Direct return!
};

// Project functions - SIMPLIFIED!
export const getAllProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) return [];
  
  return data.map(project => ({
    value: project.id,
    label: project.name
  }));
};

export const createProject = async (name: string) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name }])
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    value: data.id,
    label: data.name
  };
};

// Time Logs - NEW SIMPLIFIED FUNCTIONS!
export const getTimeLogsByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('time_logs')
    .select('*')
    .eq('userid', userId)
    .order('createdat', { ascending: false });
  
  if (error) return [];
  return data; // Direct return!
};

export const createTimeLog = async (data: Omit<TimeLog, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data: newTimeLog, error } = await supabase
    .from('time_logs')
    .insert([{
      ...data,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating time log:', error);
    throw error;
  }
  
  return newTimeLog; // Direct return!
};

// Task Action Items - NEW FUNCTIONS!
export const getTaskActionItemsByTaskId = async (taskId: string) => {
  const { data, error } = await supabase
    .from('task_action_items')
    .select('*')
    .eq('taskid', taskId)
    .order('serialno', { ascending: true });
  
  if (error) return [];
  return data; // Direct return!
};

export const createTaskActionItem = async (data: Omit<TaskActionItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data: newItem, error } = await supabase
    .from('task_action_items')
    .insert([{
      ...data,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task action item:', error);
    throw error;
  }
  
  return newItem; // Direct return!
};

export const updateTaskActionItem = async (id: string, data: Partial<TaskActionItem>) => {
  const { data: updatedItem, error } = await supabase
    .from('task_action_items')
    .update({
      ...data,
      updatedat: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating task action item:', error);
    throw error;
  }
  
  return updatedItem; // Direct return!
};

// Receipts - NEW SIMPLIFIED FUNCTIONS!
export const getReceiptsByExpenseItemId = async (expenseItemId: string) => {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('expenseitemid', expenseItemId);
  
  if (error) return [];
  return data; // Direct return!
};

export const createReceipt = async (data: Omit<Receipt, 'id' | 'createdAt'>) => {
  const { data: newReceipt, error } = await supabase
    .from('receipts')
    .insert([{
      ...data,
      createdat: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating receipt:', error);
    throw error;
  }
  
  return newReceipt; // Direct return!
};

// Helper function to get user organization
export const getUserOrganization = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('organizationid')
    .eq('id', userId)
    .single();
  
  if (error) return null;
  return data?.organizationid || null;
};