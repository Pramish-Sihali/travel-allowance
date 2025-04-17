// lib/db.ts

import { supabase } from './supabase';
import { TravelRequest, ExpenseItem, Receipt, Notification } from '@/types';
import { UserRole } from '@/types/auth';

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

// Travel Requests

// Updated API functions in lib/db.ts

export const getAllTravelRequests = async () => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  // Map database column names to frontend field names and provide defaults
  return data.map(item => ({
    id: item.id,
    employeeId: item.employee_id || '',
    employeeName: item.employee_name || 'Unknown',
    department: item.department || '',
    designation: item.designation || '',
    purpose: item.purpose || '',
    travelDateFrom: item.travel_date_from || new Date().toISOString(),
    travelDateTo: item.travel_date_to || new Date().toISOString(),
    totalAmount: item.total_amount || 0,
    status: item.status || 'pending',
    requestType: item.request_type || 'normal',
    previousOutstandingAdvance: item.previous_outstanding_advance || 0,
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString(),
    
    // Add the missing fields
    project: item.project || '',
    projectOther: item.project_other || '',
    purposeType: item.purpose_type || '',
    purposeOther: item.purpose_other || '',
    location: item.location || '',
    locationOther: item.location_other || '',
    transportMode: item.transport_mode || '',
    stationPickDrop: item.station_pick_drop || '',
    localConveyance: item.local_conveyance || '',
    rideShareUsed: item.ride_share_used || false,
    ownVehicleReimbursement: item.own_vehicle_reimbursement || false,
    
    // Comments
    approverComments: item.approver_comments,
    checkerComments: item.checker_comments
  }));
};

export const getTravelRequestsByEmployeeId = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  // Map database column names to frontend field names and provide defaults
  return data.map(item => ({
    id: item.id,
    employeeId: item.employee_id || '',
    employeeName: item.employee_name || 'Unknown',
    department: item.department || '',
    designation: item.designation || '',
    purpose: item.purpose || '',
    travelDateFrom: item.travel_date_from || new Date().toISOString(),
    travelDateTo: item.travel_date_to || new Date().toISOString(),
    totalAmount: item.total_amount || 0,
    status: item.status || 'pending',
    requestType: item.request_type || 'normal',
    previousOutstandingAdvance: item.previous_outstanding_advance || 0,
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString(),
    
    // Add the missing fields
    project: item.project || '',
    projectOther: item.project_other || '',
    purposeType: item.purpose_type || '',
    purposeOther: item.purpose_other || '',
    location: item.location || '',
    locationOther: item.location_other || '',
    transportMode: item.transport_mode || '',
    stationPickDrop: item.station_pick_drop || '',
    localConveyance: item.local_conveyance || '',
    rideShareUsed: item.ride_share_used || false,
    ownVehicleReimbursement: item.own_vehicle_reimbursement || false,
    
    // Comments
    approverComments: item.approver_comments,
    checkerComments: item.checker_comments
  }));
};



export const getTravelRequestById = async (id: string) => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  
  // Map database column names to frontend field names and provide defaults
  return {
    id: data.id,
    employeeId: data.employee_id || '',
    employeeName: data.employee_name || 'Unknown',
    department: data.department || '',
    designation: data.designation || '',
    purpose: data.purpose || '',
    travelDateFrom: data.travel_date_from || new Date().toISOString(),
    travelDateTo: data.travel_date_to || new Date().toISOString(),
    totalAmount: data.total_amount || 0,
    status: data.status || 'pending',
    requestType: data.request_type || 'normal',
    previousOutstandingAdvance: data.previous_outstanding_advance || 0,
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
    
    // Add the missing fields
    project: data.project || '',
    projectOther: data.project_other || '',
    purposeType: data.purpose_type || '',
    purposeOther: data.purpose_other || '',
    location: data.location || '',
    locationOther: data.location_other || '',
    transportMode: data.transport_mode || '',
    stationPickDrop: data.station_pick_drop || '',
    localConveyance: data.local_conveyance || '',
    rideShareUsed: data.ride_share_used || false,
    ownVehicleReimbursement: data.own_vehicle_reimbursement || false,
    
    // Comments
    approverComments: data.approver_comments,
    checkerComments: data.checker_comments
  };
};
export const createTravelRequest = async (data: Omit<TravelRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Ensure date conversion is correct - start with midnight for consistency
    let travelDateFrom, travelDateTo;
    
    try {
      if (typeof data.travelDateFrom === 'string') {
        // Ensure the date has a time component by adding T00:00:00Z
        if (data.travelDateFrom.includes('T')) {
          travelDateFrom = data.travelDateFrom;
        } else {
          travelDateFrom = `${data.travelDateFrom}T00:00:00Z`;
        }
      } else {
        travelDateFrom = new Date(data.travelDateFrom).toISOString();
      }
      
      if (typeof data.travelDateTo === 'string') {
        // Ensure the date has a time component by adding T00:00:00Z
        if (data.travelDateTo.includes('T')) {
          travelDateTo = data.travelDateTo;
        } else {
          travelDateTo = `${data.travelDateTo}T00:00:00Z`;
        }
      } else {
        travelDateTo = new Date(data.travelDateTo).toISOString();
      }
    } catch (e: unknown) {
      console.error('Date conversion error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      throw new Error(`Date conversion failed: ${errorMessage}`);
    }

    // Parse total amount to ensure it's a number
    const totalAmount = typeof data.totalAmount === 'string' 
      ? parseFloat(data.totalAmount) 
      : data.totalAmount;
    
    const previousAdvance = data.previousOutstandingAdvance
      ? (typeof data.previousOutstandingAdvance === 'string'
          ? parseFloat(data.previousOutstandingAdvance)
          : data.previousOutstandingAdvance)
      : 0;
    
    // Process boolean fields
    const rideShareUsed = data.rideShareUsed === true;
    const ownVehicleReimbursement = data.ownVehicleReimbursement === true;
    
    const insertData = {
      employee_id: data.employeeId,
      employee_name: data.employeeName,
      department: data.department,
      designation: data.designation,
      purpose: data.purpose,
      travel_date_from: travelDateFrom,
      travel_date_to: travelDateTo,
      total_amount: totalAmount,
      status: data.status,
      request_type: data.requestType,
      previous_outstanding_advance: previousAdvance,
      // Add new fields
      project: data.project,
      project_other: data.projectOther,
      purpose_type: data.purposeType,
      purpose_other: data.purposeOther,
      location: data.location,
      location_other: data.locationOther,
      transport_mode: data.transportMode,
      station_pick_drop: data.stationPickDrop,
      local_conveyance: data.localConveyance,
      ride_share_used: rideShareUsed,
      own_vehicle_reimbursement: ownVehicleReimbursement
    };

    console.log('Inserting travel request with data:', insertData);
    
    const { data: newRequest, error } = await supabase
      .from('travel_requests')
      .insert([insertData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating travel request:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    if (!newRequest) {
      throw new Error('No data returned from travel request creation');
    }
    
    return {
      id: newRequest.id,
      employeeId: newRequest.employee_id,
      employeeName: newRequest.employee_name,
      department: newRequest.department,
      designation: newRequest.designation,
      purpose: newRequest.purpose,
      travelDateFrom: newRequest.travel_date_from,
      travelDateTo: newRequest.travel_date_to,
      totalAmount: newRequest.total_amount,
      status: newRequest.status,
      requestType: newRequest.request_type,
      previousOutstandingAdvance: newRequest.previous_outstanding_advance,
      // Include new fields in return
      project: newRequest.project,
      projectOther: newRequest.project_other,
      purposeType: newRequest.purpose_type,
      purposeOther: newRequest.purpose_other,
      location: newRequest.location,
      locationOther: newRequest.location_other,
      transportMode: newRequest.transport_mode,
      stationPickDrop: newRequest.station_pick_drop,
      localConveyance: newRequest.local_conveyance,
      rideShareUsed: newRequest.ride_share_used,
      ownVehicleReimbursement: newRequest.own_vehicle_reimbursement,
      createdAt: newRequest.created_at,
      updatedAt: newRequest.updated_at
    };
  } catch (error: unknown) {
    console.error('Error in createTravelRequest:', error);
    throw error;
  }
};


// Expense Items
export const getExpenseItemsByRequestId = async (requestId: string) => {
  const { data, error } = await supabase
    .from('expense_items')
    .select('*')
    .eq('request_id', requestId);
  
  if (error) return [];
  
  return data.map(item => ({
    id: item.id,
    requestId: item.request_id,
    category: item.category || 'other',
    amount: item.amount || 0,
    description: item.description || ''
  }));
};

export const createExpenseItem = async (data: Omit<ExpenseItem, 'id'>) => {
  try {
    // Ensure amount is a number
    const amount = typeof data.amount === 'string' 
      ? parseFloat(data.amount) 
      : data.amount;
    
    const { data: newItem, error } = await supabase
      .from('expense_items')
      .insert([{
        request_id: data.requestId,
        category: data.category,
        amount: amount,
        description: data.description
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating expense item:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    return {
      id: newItem.id,
      requestId: newItem.request_id,
      category: newItem.category,
      amount: newItem.amount,
      description: newItem.description
    };
  } catch (error: unknown) {
    console.error('Error in createExpenseItem:', error);
    throw error;
  }
};

export const getReceiptsByExpenseItemId = async (expenseItemId: string) => {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('expense_item_id', expenseItemId);
  
  if (error) return [];
  
  return data.map(receipt => ({
    id: receipt.id,
    expenseItemId: receipt.expense_item_id,
    originalFilename: receipt.original_filename,
    storedFilename: receipt.stored_filename,
    fileType: receipt.file_type,
    uploadDate: receipt.upload_date,
    storagePath: receipt.storage_path,
    publicUrl: receipt.public_url
  }));
};

export const createReceipt = async (data: Omit<Receipt, 'id' | 'uploadDate'>) => {
  const { data: newReceipt, error } = await supabase
    .from('receipts')
    .insert([{
      expense_item_id: data.expenseItemId,
      original_filename: data.originalFilename,
      stored_filename: data.storedFilename,
      file_type: data.fileType,
      storage_path: data.storagePath,
      public_url: data.publicUrl
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating receipt:', error);
    throw error;
  }
  
  return {
    id: newReceipt.id,
    expenseItemId: newReceipt.expense_item_id,
    originalFilename: newReceipt.original_filename,
    storedFilename: newReceipt.stored_filename,
    fileType: newReceipt.file_type,
    uploadDate: newReceipt.upload_date,
    storagePath: newReceipt.storage_path,
    publicUrl: newReceipt.public_url
  };
};

// Notifications
export const getNotificationsByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  return data.map(notification => ({
    id: notification.id,
    userId: notification.user_id,
    requestId: notification.request_id,
    message: notification.message,
    isRead: notification.is_read,
    createdAt: notification.created_at
  }));
};

export const createNotification = async (data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
  const { data: newNotification, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: data.userId,
      request_id: data.requestId,
      message: data.message,
      is_read: false
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
  
  return {
    id: newNotification.id,
    userId: newNotification.user_id,
    requestId: newNotification.request_id,
    message: newNotification.message,
    isRead: newNotification.is_read,
    createdAt: newNotification.created_at
  };
};

export const markNotificationAsRead = async (id: string) => {
  const { data: updatedNotification, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) return null;
  
  return {
    id: updatedNotification.id,
    userId: updatedNotification.user_id,
    requestId: updatedNotification.request_id,
    message: updatedNotification.message,
    isRead: updatedNotification.is_read,
    createdAt: updatedNotification.created_at
  };
};


export const updateTravelRequestStatus = async (id: string, status: TravelRequest['status'], additionalData = {}) => {
  try {
    console.log('updateTravelRequestStatus called with:', { id, status, additionalData });
    
    const updateData = { 
      status, 
      updated_at: new Date().toISOString(),
      ...additionalData
    };
    
    // Convert camelCase to snake_case for database
    const formattedData: Record<string, any> = {}; 
    Object.keys(updateData).forEach(key => {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      formattedData[snakeKey] = updateData[key as keyof typeof updateData];
    });
    
    console.log('Formatted data for update:', formattedData);
    
    const { data: updatedRequest, error } = await supabase
      .from('travel_requests')
      .update(formattedData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Supabase error updating travel request:', error);
      return null;
    }
    
    if (!updatedRequest) {
      console.error('No data returned from update operation');
      return null;
    }
    
    console.log('Update successful, returned data:', updatedRequest);
    
    // Map to frontend model with all fields
    return {
      id: updatedRequest.id,
      employeeId: updatedRequest.employee_id,
      employeeName: updatedRequest.employee_name,
      department: updatedRequest.department,
      designation: updatedRequest.designation,
      purpose: updatedRequest.purpose,
      travelDateFrom: updatedRequest.travel_date_from,
      travelDateTo: updatedRequest.travel_date_to,
      totalAmount: updatedRequest.total_amount,
      status: updatedRequest.status,
      requestType: updatedRequest.request_type,
      previousOutstandingAdvance: updatedRequest.previous_outstanding_advance,
      createdAt: updatedRequest.created_at,
      updatedAt: updatedRequest.updated_at,
      
      // Add the missing fields
      project: updatedRequest.project || '',
      projectOther: updatedRequest.project_other || '',
      purposeType: updatedRequest.purpose_type || '',
      purposeOther: updatedRequest.purpose_other || '',
      location: updatedRequest.location || '',
      locationOther: updatedRequest.location_other || '',
      transportMode: updatedRequest.transport_mode || '',
      stationPickDrop: updatedRequest.station_pick_drop || '',
      localConveyance: updatedRequest.local_conveyance || '',
      rideShareUsed: updatedRequest.ride_share_used || false,
      ownVehicleReimbursement: updatedRequest.own_vehicle_reimbursement || false,
      
      // Comments
      approverComments: updatedRequest.approver_comments,
      checkerComments: updatedRequest.checker_comments
    };
  } catch (error) {
    console.error('Exception in updateTravelRequestStatus:', error);
    return null;
  }
};


// Function to get pending verification requests for checkers
export const getPendingVerificationRequests = async () => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('status', 'pending_verification')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  // Map database column names to frontend field names and provide defaults
  return data.map(item => ({
    id: item.id,
    employeeId: item.employee_id || '',
    employeeName: item.employee_name || 'Unknown',
    department: item.department || '',
    designation: item.designation || '',
    purpose: item.purpose || '',
    travelDateFrom: item.travel_date_from || new Date().toISOString(),
    travelDateTo: item.travel_date_to || new Date().toISOString(),
    totalAmount: item.total_amount || 0,
    status: item.status || 'pending_verification',
    requestType: item.request_type || 'normal',
    previousOutstandingAdvance: item.previous_outstanding_advance || 0,
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString(),
    
    // Add the missing fields
    project: item.project || '',
    projectOther: item.project_other || '',
    purposeType: item.purpose_type || '',
    purposeOther: item.purpose_other || '',
    location: item.location || '',
    locationOther: item.location_other || '',
    transportMode: item.transport_mode || '',
    stationPickDrop: item.station_pick_drop || '',
    localConveyance: item.local_conveyance || '',
    rideShareUsed: item.ride_share_used || false,
    ownVehicleReimbursement: item.own_vehicle_reimbursement || false,
    
    // Comments
    approverComments: item.approver_comments,
    checkerComments: item.checker_comments
  }));
};

// Function to get verified requests by checker
export const getVerifiedRequestsByChecker = async () => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .in('status', ['approved', 'rejected_by_checker'])
    .order('updated_at', { ascending: false });
  
  if (error) return [];
  
  return data.map(item => ({
    id: item.id,
    employeeId: item.employee_id || '',
    employeeName: item.employee_name || 'Unknown',
    department: item.department || '',
    designation: item.designation || '',
    purpose: item.purpose || '',
    travelDateFrom: item.travel_date_from || new Date().toISOString(),
    travelDateTo: item.travel_date_to || new Date().toISOString(),
    totalAmount: item.total_amount || 0,
    status: item.status || 'approved',
    requestType: item.request_type || 'normal',
    previousOutstandingAdvance: item.previous_outstanding_advance || 0,
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString(),
    
    // Add the missing fields
    project: item.project || '',
    projectOther: item.project_other || '',
    purposeType: item.purpose_type || '',
    purposeOther: item.purpose_other || '',
    location: item.location || '',
    locationOther: item.location_other || '',
    transportMode: item.transport_mode || '',
    stationPickDrop: item.station_pick_drop || '',
    localConveyance: item.local_conveyance || '',
    rideShareUsed: item.ride_share_used || false,
    ownVehicleReimbursement: item.own_vehicle_reimbursement || false,
    
    // Comments
    approverComments: item.approver_comments,
    checkerComments: item.checker_comments
  }));
};

// Add these functions to lib/db.ts

// User management functions
export const getUsersByRole = async (role: UserRole) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role);
  
  if (error) return [];
  return data;
};

export const createUser = async (userData: any) => {
  // In a production app, you'd hash the password here
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email: userData.email,
      name: userData.name,
      password: userData.password, // Would be hashed in production
      role: userData.role,
      department: userData.department || null,
      position: userData.designation || null
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, userData: any) => {
  const updateData: any = {};
  
  // Only update fields that are provided
  if (userData.name) updateData.name = userData.name;
  if (userData.email) updateData.email = userData.email;
  if (userData.password) updateData.password = userData.password; // Would be hashed in production
  if (userData.role) updateData.role = userData.role;
  if (userData.department) updateData.department = userData.department;
  if (userData.designation) updateData.position = userData.designation;
  
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Project management functions
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

// Add this function to lib/db.ts

export const deleteTravelRequest = async (id: string) => {
  try {
    // First delete any related expense items and receipts
    // This assumes you have cascade delete set up in your database
    // If not, you'd need to handle deleting related records explicitly
    
    const { error } = await supabase
      .from('travel_requests')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting travel request:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in deleteTravelRequest:', error);
    return false;
  }
};


// Add these functions to lib/db.ts

// In-Valley Request Functions
export const getAllValleyRequests = async () => {
  const { data, error } = await supabase
    .from('valley_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  // Map database column names to frontend field names
  return data.map(item => ({
    id: item.id,
    employeeId: item.employee_id || '',
    employeeName: item.employee_name || 'Unknown',
    department: item.department || '',
    designation: item.designation || '',
    purpose: item.purpose || '',
    travelDateFrom: item.travel_date_from || item.expense_date || new Date().toISOString(),
    travelDateTo: item.travel_date_to || item.expense_date || new Date().toISOString(),
    expenseDate: item.expense_date || new Date().toISOString(),
    totalAmount: item.total_amount || 0,
    status: item.status || 'pending',
    requestType: 'in-valley', // Hard-code type for valley requests
    project: item.project || '',
    location: item.location || '',
    description: item.description || '',
    meetingType: item.meeting_type || '',
    meetingParticipants: item.meeting_participants || '',
    paymentMethod: item.payment_method || '',
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString(),
    approverComments: item.approver_comments,
    checkerComments: item.checker_comments,
    previousOutstandingAdvance: 0 // Default value for compatibility
  }));
};

export const getValleyRequestsByEmployeeId = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('valley_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  // Map database column names to frontend field names
  return data.map(item => ({
    id: item.id,
    employeeId: item.employee_id || '',
    employeeName: item.employee_name || 'Unknown',
    department: item.department || '',
    designation: item.designation || '',
    purpose: item.purpose || '',
    travelDateFrom: item.travel_date_from || item.expense_date || new Date().toISOString(),
    travelDateTo: item.travel_date_to || item.expense_date || new Date().toISOString(),
    expenseDate: item.expense_date || new Date().toISOString(),
    totalAmount: item.total_amount || 0,
    status: item.status || 'pending',
    requestType: 'in-valley', // Hard-code type for valley requests
    project: item.project || '',
    location: item.location || '',
    description: item.description || '',
    meetingType: item.meeting_type || '',
    meetingParticipants: item.meeting_participants || '',
    paymentMethod: item.payment_method || '',
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString(),
    approverComments: item.approver_comments,
    checkerComments: item.checker_comments,
    previousOutstandingAdvance: 0 // Default value for compatibility
  }));
};

export const getValleyRequestById = async (id: string) => {
  const { data, error } = await supabase
    .from('valley_requests')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  
  // Map database column names to frontend field names
  return {
    id: data.id,
    employeeId: data.employee_id || '',
    employeeName: data.employee_name || 'Unknown',
    department: data.department || '',
    designation: data.designation || '',
    purpose: data.purpose || '',
    travelDateFrom: data.travel_date_from || data.expense_date || new Date().toISOString(),
    travelDateTo: data.travel_date_to || data.expense_date || new Date().toISOString(),
    expenseDate: data.expense_date || new Date().toISOString(),
    totalAmount: data.total_amount || 0,
    status: data.status || 'pending',
    requestType: 'in-valley', // Hard-code type for valley requests
    project: data.project || '',
    location: data.location || '',
    description: data.description || '',
    meetingType: data.meeting_type || '',
    meetingParticipants: data.meeting_participants || '',
    paymentMethod: data.payment_method || '',
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
    approverComments: data.approver_comments,
    checkerComments: data.checker_comments,
    previousOutstandingAdvance: 0 // Default value for compatibility
  };
};

export const createValleyRequest = async (data: any) => {
  try {
    // Ensure date conversion is correct
    let expenseDate, travelDateFrom, travelDateTo;
    
    try {
      if (typeof data.expenseDate === 'string') {
        if (data.expenseDate.includes('T')) {
          expenseDate = data.expenseDate;
        } else {
          expenseDate = `${data.expenseDate}T00:00:00Z`;
        }
      } else if (data.expenseDate instanceof Date) {
        expenseDate = data.expenseDate.toISOString();
      } else {
        expenseDate = new Date().toISOString();
      }
      
      // Use expense date for travel dates for compatibility
      travelDateFrom = travelDateTo = expenseDate;
    } catch (e: unknown) {
      console.error('Date conversion error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      throw new Error(`Date conversion failed: ${errorMessage}`);
    }
    
    // Parse total amount to ensure it's a number
    const totalAmount = typeof data.totalAmount === 'string' 
      ? parseFloat(data.totalAmount) 
      : data.totalAmount;
    
    const insertData = {
      id: data.id || undefined, // Allow passing an existing ID
      employee_id: data.employeeId,
      employee_name: data.employeeName,
      department: data.department,
      designation: data.designation,
      purpose: data.purpose,
      travel_date_from: travelDateFrom,
      travel_date_to: travelDateTo,
      expense_date: expenseDate,
      total_amount: totalAmount,
      status: data.status || 'pending',
      request_type: 'in-valley',
      project: data.project,
      description: data.description,
      location: data.location,
      meeting_type: data.meetingType,
      meeting_participants: data.meetingParticipants,
      payment_method: data.paymentMethod,
    };
    
    console.log('Inserting in-valley request with data:', insertData);
    
    const { data: newRequest, error } = await supabase
      .from('valley_requests')
      .insert([insertData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating in-valley request:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    if (!newRequest) {
      throw new Error('No data returned from in-valley request creation');
    }
    
    return {
      id: newRequest.id,
      employeeId: newRequest.employee_id,
      employeeName: newRequest.employee_name,
      department: newRequest.department,
      designation: newRequest.designation,
      purpose: newRequest.purpose,
      travelDateFrom: newRequest.travel_date_from || newRequest.expense_date,
      travelDateTo: newRequest.travel_date_to || newRequest.expense_date,
      expenseDate: newRequest.expense_date,
      totalAmount: newRequest.total_amount,
      status: newRequest.status,
      requestType: 'in-valley',
      project: newRequest.project,
      location: newRequest.location,
      description: newRequest.description,
      meetingType: newRequest.meeting_type,
      meetingParticipants: newRequest.meeting_participants,
      paymentMethod: newRequest.payment_method,
      createdAt: newRequest.created_at,
      updatedAt: newRequest.updated_at,
      previousOutstandingAdvance: 0 // For compatibility
    };
  } catch (error: unknown) {
    console.error('Error in createValleyRequest:', error);
    throw error;
  }
};

export const updateValleyRequestStatus = async (id: string, status: string, additionalData = {}) => {
  try {
    console.log('updateValleyRequestStatus called with:', { id, status, additionalData });
    
    const updateData = { 
      status, 
      updated_at: new Date().toISOString(),
      ...additionalData
    };
    
    // Convert camelCase to snake_case for database
    const formattedData: Record<string, any> = {}; 
    Object.keys(updateData).forEach(key => {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      formattedData[snakeKey] = updateData[key as keyof typeof updateData];
    });
    
    console.log('Formatted data for update:', formattedData);
    
    const { data: updatedRequest, error } = await supabase
      .from('valley_requests')
      .update(formattedData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating in-valley request:', error);
      return null;
    }
    
    if (!updatedRequest) {
      console.error('No data returned from update operation');
      return null;
    }
    
    console.log('Update successful, returned data:', updatedRequest);
    
    // Map to frontend model with all fields
    return {
      id: updatedRequest.id,
      employeeId: updatedRequest.employee_id,
      employeeName: updatedRequest.employee_name,
      department: updatedRequest.department,
      designation: updatedRequest.designation,
      purpose: updatedRequest.purpose,
      travelDateFrom: updatedRequest.travel_date_from || updatedRequest.expense_date,
      travelDateTo: updatedRequest.travel_date_to || updatedRequest.expense_date,
      expenseDate: updatedRequest.expense_date,
      totalAmount: updatedRequest.total_amount,
      status: updatedRequest.status,
      requestType: 'in-valley',
      project: updatedRequest.project,
      location: updatedRequest.location,
      description: updatedRequest.description,
      meetingType: updatedRequest.meeting_type,
      meetingParticipants: updatedRequest.meeting_participants,
      paymentMethod: updatedRequest.payment_method,
      createdAt: updatedRequest.created_at,
      updatedAt: updatedRequest.updated_at,
      approverComments: updatedRequest.approver_comments,
      checkerComments: updatedRequest.checker_comments,
      previousOutstandingAdvance: 0 // For compatibility
    };
  } catch (error) {
    console.error('Exception in updateValleyRequestStatus:', error);
    return null;
  }
};

export const getValleyExpensesByRequestId = async (requestId: string) => {
  const { data, error } = await supabase
    .from('valley_expenses')
    .select('*')
    .eq('request_id', requestId);
  
  if (error) return [];
  
  return data.map(item => ({
    id: item.id,
    requestId: item.request_id,
    category: item.category || 'other',
    amount: item.amount || 0,
    description: item.description || ''
  }));
};

export const createValleyExpense = async (data: any) => {
  try {
    // Ensure amount is a number
    const amount = typeof data.amount === 'string' 
      ? parseFloat(data.amount) 
      : data.amount;
    
    const { data: newItem, error } = await supabase
      .from('valley_expenses')
      .insert([{
        request_id: data.requestId,
        category: data.category,
        amount: amount,
        description: data.description
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating valley expense item:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    return {
      id: newItem.id,
      requestId: newItem.request_id,
      category: newItem.category,
      amount: newItem.amount,
      description: newItem.description
    };
  } catch (error: unknown) {
    console.error('Error in createValleyExpense:', error);
    throw error;
  }
};