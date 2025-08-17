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
  
  // Transform database snake_case to camelCase
  return data.map(request => ({
    id: request.id,
    employeeId: request.employeeid,
    employeeName: request.employeename,
    department: request.department,
    designation: request.designation,
    requestType: request.requesttype,
    project: request.project,
    projectOther: request.projectother,
    purpose: request.purpose,
    purposeType: request.purposetype,
    purposeOther: request.purposeother,
    location: request.location,
    locationOther: request.locationother,
    travelDateFrom: request.traveldatefrom,
    travelDateTo: request.traveldateto,
    transportMode: request.transportmode,
    stationPickDrop: request.stationpickdrop,
    localConveyance: request.localconveyance,
    rideShareUsed: request.rideshareused,
    ownVehicleReimbursement: request.ownvehiclereimbursement,
    totalAmount: request.totalamount,
    previousOutstandingAdvance: request.previousoutstandingadvance,
    isGroupTravel: request.isgrouptravel,
    isGroupCaptain: request.isgroupcaptain,
    groupSize: request.groupsize,
    groupMembers: request.groupmembers ? request.groupmembers.split(',') : null,
    groupDescription: request.groupdescription,
    estimatedAmount: request.estimatedamount,
    advanceNotes: request.advancenotes,
    emergencyReason: request.emergencyreason,
    emergencyReasonOther: request.emergencyreasonother,
    emergencyJustification: request.emergencyjustification,
    emergencyAmount: request.emergencyamount,
    needsFinancialAttention: request.needsfinancialattention,
    isUrgent: request.isurgent,
    status: request.status,
    phase: request.phase,
    approverId: request.approverid,
    approverComments: request.approvercomments,
    checkerComments: request.checkercomments,
    financeComments: request.financecomments,
    createdAt: request.createdat,
    updatedAt: request.updatedat,
    travelDetailsApprovedAt: request.traveldetailsapprovedat,
    expensesSubmittedAt: request.expensessubmittedat
  }));
};

export const getTravelRequestsByEmployeeId = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('employeeid', employeeId)
    .order('createdat', { ascending: false });
  
  if (error) return [];
  
  // Transform database snake_case to camelCase
  return data.map(request => ({
    id: request.id,
    employeeId: request.employeeid,
    employeeName: request.employeename,
    department: request.department,
    designation: request.designation,
    requestType: request.requesttype,
    project: request.project,
    projectOther: request.projectother,
    purpose: request.purpose,
    purposeType: request.purposetype,
    purposeOther: request.purposeother,
    location: request.location,
    locationOther: request.locationother,
    travelDateFrom: request.traveldatefrom,
    travelDateTo: request.traveldateto,
    transportMode: request.transportmode,
    stationPickDrop: request.stationpickdrop,
    localConveyance: request.localconveyance,
    rideShareUsed: request.rideshareused,
    ownVehicleReimbursement: request.ownvehiclereimbursement,
    totalAmount: request.totalamount,
    previousOutstandingAdvance: request.previousoutstandingadvance,
    isGroupTravel: request.isgrouptravel,
    isGroupCaptain: request.isgroupcaptain,
    groupSize: request.groupsize,
    groupMembers: request.groupmembers ? request.groupmembers.split(',') : null,
    groupDescription: request.groupdescription,
    estimatedAmount: request.estimatedamount,
    advanceNotes: request.advancenotes,
    emergencyReason: request.emergencyreason,
    emergencyReasonOther: request.emergencyreasonother,
    emergencyJustification: request.emergencyjustification,
    emergencyAmount: request.emergencyamount,
    needsFinancialAttention: request.needsfinancialattention,
    isUrgent: request.isurgent,
    status: request.status,
    phase: request.phase,
    approverId: request.approverid,
    approverComments: request.approvercomments,
    checkerComments: request.checkercomments,
    financeComments: request.financecomments,
    createdAt: request.createdat,
    updatedAt: request.updatedat,
    travelDetailsApprovedAt: request.traveldetailsapprovedat,
    expensesSubmittedAt: request.expensessubmittedat
  }));
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
  
  // Transform database snake_case to camelCase
  return {
    id: data.id,
    employeeId: data.employeeid,
    employeeName: data.employeename,
    department: data.department,
    designation: data.designation,
    requestType: data.requesttype,
    project: data.project,
    projectOther: data.projectother,
    purpose: data.purpose,
    purposeType: data.purposetype,
    purposeOther: data.purposeother,
    location: data.location,
    locationOther: data.locationother,
    travelDateFrom: data.traveldatefrom,
    travelDateTo: data.traveldateto,
    transportMode: data.transportmode,
    stationPickDrop: data.stationpickdrop,
    localConveyance: data.localconveyance,
    rideShareUsed: data.rideshareused,
    ownVehicleReimbursement: data.ownvehiclereimbursement,
    totalAmount: data.totalamount,
    previousOutstandingAdvance: data.previousoutstandingadvance,
    isGroupTravel: data.isgrouptravel,
    isGroupCaptain: data.isgroupcaptain,
    groupSize: data.groupsize,
    groupMembers: data.groupmembers ? data.groupmembers.split(',') : null,
    groupDescription: data.groupdescription,
    estimatedAmount: data.estimatedamount,
    advanceNotes: data.advancenotes,
    emergencyReason: data.emergencyreason,
    emergencyReasonOther: data.emergencyreasonother,
    emergencyJustification: data.emergencyjustification,
    emergencyAmount: data.emergencyamount,
    needsFinancialAttention: data.needsfinancialattention,
    isUrgent: data.isurgent,
    status: data.status,
    phase: data.phase,
    approverId: data.approverid,
    approverComments: data.approvercomments,
    checkerComments: data.checkercomments,
    financeComments: data.financecomments,
    createdAt: data.createdat,
    updatedAt: data.updatedat,
    travelDetailsApprovedAt: data.traveldetailsapprovedat,
    expensesSubmittedAt: data.expensessubmittedat
  };
};

export const createTravelRequest = async (data: Omit<TravelRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<TravelRequest> => {
  // Transform camelCase fields to database snake_case fields
  const dbData = {
    id: uuidv4(),
    employeeid: data.employeeId,
    employeename: data.employeeName,
    department: data.department,
    designation: data.designation,
    requesttype: data.requestType,
    project: data.project,
    projectother: data.projectOther,
    purpose: data.purpose,
    purposetype: data.purposeType,
    purposeother: data.purposeOther,
    location: data.location,
    locationother: data.locationOther,
    traveldatefrom: data.travelDateFrom,
    traveldateto: data.travelDateTo,
    transportmode: data.transportMode,
    stationpickdrop: data.stationPickDrop,
    localconveyance: data.localConveyance,
    rideshareused: data.rideShareUsed,
    ownvehiclereimbursement: data.ownVehicleReimbursement,
    totalamount: data.totalAmount,
    previousoutstandingadvance: data.previousOutstandingAdvance,
    isgrouptravel: data.isGroupTravel,
    isgroupcaptain: data.isGroupCaptain,
    groupsize: data.groupSize,
    groupmembers: Array.isArray(data.groupMembers) ? data.groupMembers.join(',') : data.groupMembers,
    groupdescription: data.groupDescription,
    estimatedamount: data.estimatedAmount,
    advancenotes: data.advanceNotes,
    emergencyreason: data.emergencyReason,
    emergencyreasonother: data.emergencyReasonOther,
    emergencyjustification: data.emergencyJustification,
    emergencyamount: data.emergencyAmount,
    needsfinancialattention: data.needsFinancialAttention,
    isurgent: data.isUrgent,
    status: data.status || 'pending',
    phase: data.phase || 1,
    approverid: data.approverId,
    organizationid: (data as any).organizationId,
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

  // Transform the response back to camelCase
  const transformedRequest = {
    id: newRequest.id,
    employeeId: newRequest.employeeid,
    employeeName: newRequest.employeename,
    department: newRequest.department,
    designation: newRequest.designation,
    requestType: newRequest.requesttype,
    project: newRequest.project,
    projectOther: newRequest.projectother,
    purpose: newRequest.purpose,
    purposeType: newRequest.purposetype,
    purposeOther: newRequest.purposeother,
    location: newRequest.location,
    locationOther: newRequest.locationother,
    travelDateFrom: newRequest.traveldatefrom,
    travelDateTo: newRequest.traveldateto,
    transportMode: newRequest.transportmode,
    stationPickDrop: newRequest.stationpickdrop,
    localConveyance: newRequest.localconveyance,
    rideShareUsed: newRequest.rideshareused,
    ownVehicleReimbursement: newRequest.ownvehiclereimbursement,
    totalAmount: newRequest.totalamount,
    previousOutstandingAdvance: newRequest.previousoutstandingadvance,
    isGroupTravel: newRequest.isgrouptravel,
    isGroupCaptain: newRequest.isgroupcaptain,
    groupSize: newRequest.groupsize,
    groupMembers: newRequest.groupmembers ? newRequest.groupmembers.split(',') : null,
    groupDescription: newRequest.groupdescription,
    estimatedAmount: newRequest.estimatedamount,
    advanceNotes: newRequest.advancenotes,
    emergencyReason: newRequest.emergencyreason,
    emergencyReasonOther: newRequest.emergencyreasonother,
    emergencyJustification: newRequest.emergencyjustification,
    emergencyAmount: newRequest.emergencyamount,
    needsFinancialAttention: newRequest.needsfinancialattention,
    isUrgent: newRequest.isurgent,
    status: newRequest.status,
    phase: newRequest.phase,
    approverId: newRequest.approverid,
    approverComments: newRequest.approvercomments,
    checkerComments: newRequest.checkercomments,
    financeComments: newRequest.financecomments,
    createdAt: newRequest.createdat,
    updatedAt: newRequest.updatedat,
    travelDetailsApprovedAt: newRequest.traveldetailsapprovedat,
    expensesSubmittedAt: newRequest.expensessubmittedat
  };

  return transformedRequest;
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
  
  // Transform database snake_case to camelCase
  return {
    id: updatedRequest.id,
    employeeId: updatedRequest.employeeid,
    employeeName: updatedRequest.employeename,
    department: updatedRequest.department,
    designation: updatedRequest.designation,
    requestType: updatedRequest.requesttype,
    project: updatedRequest.project,
    projectOther: updatedRequest.projectother,
    purpose: updatedRequest.purpose,
    purposeType: updatedRequest.purposetype,
    purposeOther: updatedRequest.purposeother,
    location: updatedRequest.location,
    locationOther: updatedRequest.locationother,
    travelDateFrom: updatedRequest.traveldatefrom,
    travelDateTo: updatedRequest.traveldateto,
    transportMode: updatedRequest.transportmode,
    stationPickDrop: updatedRequest.stationpickdrop,
    localConveyance: updatedRequest.localconveyance,
    rideShareUsed: updatedRequest.rideshareused,
    ownVehicleReimbursement: updatedRequest.ownvehiclereimbursement,
    totalAmount: updatedRequest.totalamount,
    previousOutstandingAdvance: updatedRequest.previousoutstandingadvance,
    isGroupTravel: updatedRequest.isgrouptravel,
    isGroupCaptain: updatedRequest.isgroupcaptain,
    groupSize: updatedRequest.groupsize,
    groupMembers: updatedRequest.groupmembers ? updatedRequest.groupmembers.split(',') : null,
    groupDescription: updatedRequest.groupdescription,
    estimatedAmount: updatedRequest.estimatedamount,
    advanceNotes: updatedRequest.advancenotes,
    emergencyReason: updatedRequest.emergencyreason,
    emergencyReasonOther: updatedRequest.emergencyreasonother,
    emergencyJustification: updatedRequest.emergencyjustification,
    emergencyAmount: updatedRequest.emergencyamount,
    needsFinancialAttention: updatedRequest.needsfinancialattention,
    isUrgent: updatedRequest.isurgent,
    status: updatedRequest.status,
    phase: updatedRequest.phase,
    approverId: updatedRequest.approverid,
    approverComments: updatedRequest.approvercomments,
    checkerComments: updatedRequest.checkercomments,
    financeComments: updatedRequest.financecomments,
    createdAt: updatedRequest.createdat,
    updatedAt: updatedRequest.updatedat,
    travelDetailsApprovedAt: updatedRequest.traveldetailsapprovedat,
    expensesSubmittedAt: updatedRequest.expensessubmittedat
  };
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

// Expense Items - With proper transformations!
export const getExpenseItemsByRequestId = async (requestId: string) => {
  const { data, error } = await supabase
    .from('expense_items')
    .select('*')
    .eq('requestid', requestId)
    .order('category', { ascending: true });
  
  if (error) return [];
  
  // Transform snake_case to camelCase
  return data.map(item => ({
    id: item.id,
    requestId: item.requestid,
    category: item.category,
    amount: item.amount,
    description: item.description,
    status: item.status,
    organizationId: item.organizationid
  }));
};

export const createExpenseItem = async (data: any) => {
  // Transform camelCase to snake_case for database
  const dbData = {
    requestid: data.requestId,
    category: data.category,
    amount: data.amount,
    description: data.description || '',
    status: data.status || 'pending',
    organizationid: data.organizationId
  };

  const { data: newItem, error } = await supabase
    .from('expense_items')
    .insert([dbData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating expense item:', error);
    throw error;
  }
  
  // Transform response back to camelCase
  return {
    id: newItem.id,
    requestId: newItem.requestid,
    category: newItem.category,
    amount: newItem.amount,
    description: newItem.description,
    status: newItem.status,
    organizationId: newItem.organizationid
  };
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


// Valley Expense Functions
export const getValleyExpensesByRequestId = async (requestId: string) => {
  const { data, error } = await supabase
    .from('valley_expenses')
    .select('*')
    .eq('requestid', requestId)
    .order('createdat', { ascending: false });
  
  if (error) return [];
  
  // Transform snake_case to camelCase
  return data.map(expense => ({
    id: expense.id,
    requestId: expense.requestid,
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
    createdAt: expense.createdat,
    updatedAt: expense.updatedat,
    status: expense.status,
    organizationId: expense.organizationid
  }));
};

export const createValleyExpense = async (data: any) => {
  // Transform camelCase to snake_case for database
  const dbData = {
    id: data.id,
    requestid: data.requestId,
    category: data.category,
    amount: data.amount,
    description: data.description || '',
    status: data.status || 'pending',
    organizationid: (data as any).organizationId,
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString()
  };

  const { data: newExpense, error } = await supabase
    .from('valley_expenses')
    .insert([dbData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating valley expense:', error);
    throw error;
  }
  
  // Transform response back to camelCase
  return {
    id: newExpense.id,
    requestId: newExpense.requestid,
    category: newExpense.category,
    amount: newExpense.amount,
    description: newExpense.description,
    createdAt: newExpense.createdat,
    updatedAt: newExpense.updatedat,
    status: newExpense.status,
    organizationId: newExpense.organizationid
  };
};