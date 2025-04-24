// lib/db.ts

import { supabase } from './supabase';
import { TravelRequest, ExpenseItem, Receipt, Notification } from '@/types';
import { UserRole } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid';


// Helper functions for mapping DB to frontend models
const mapDbToTravelRequest = (item: any) => ({
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
  
  // Standard fields
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
  checkerComments: item.checker_comments,
  
  // New fields for two-phase workflow
  phase: item.phase || 1,
  approverId: item.approver_id,
  travelDetailsApprovedAt: item.travel_details_approved_at,
  expensesSubmittedAt: item.expenses_submitted_at, 

  isGroupTravel: item.is_group_travel || false,
  isGroupCaptain: item.is_group_captain || false,
  groupSize: item.group_size || '',
  groupMembers: item.group_members ? JSON.parse(item.group_members) : [],
  groupDescription: item.group_description || '',
});

const mapDbToValleyRequest = (item: any) => ({
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
  previousOutstandingAdvance: 0, // Default value for compatibility
  
  // New fields for two-phase workflow
  phase: item.phase || 1,
  approverId: item.approver_id,
  travelDetailsApprovedAt: item.travel_details_approved_at,
  expensesSubmittedAt: item.expenses_submitted_at
});

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

// Travel Requests Functions
export const getAllTravelRequests = async () => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data.map(mapDbToTravelRequest);
};

export const getTravelRequestsByEmployeeId = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data.map(mapDbToTravelRequest);
};

export async function getTravelRequestById(id: string): Promise<TravelRequest | null> {
  console.log(`Fetching travel request with ID: ${id}`);
  
  try {
    const { data, error } = await supabase
      .from('travel_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching travel request:', error);
      return null;
    }
    
    if (!data) {
      console.log(`No travel request found with ID: ${id}`);
      return null;
    }
    
    console.log(`Travel request found, type: ${data.request_type}`);
    
    // Convert from database format (snake_case) to frontend format (camelCase)
    const travelRequest: TravelRequest = {
      id: data.id,
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      department: data.department,
      designation: data.designation,
      requestType: data.request_type,
      project: data.project,
      projectOther: data.project_other,
      purpose: data.purpose,
      purposeType: data.purpose_type,
      purposeOther: data.purpose_other,
      location: data.location,
      locationOther: data.location_other,
      travelDateFrom: data.travel_date_from,
      travelDateTo: data.travel_date_to,
      transportMode: data.transport_mode,
      stationPickDrop: data.station_pick_drop,
      localConveyance: data.local_conveyance,
      rideShareUsed: data.ride_share_used,
      ownVehicleReimbursement: data.own_vehicle_reimbursement,
      status: data.status,
      phase: data.phase,
      totalAmount: data.total_amount,
      previousOutstandingAdvance: data.previous_outstanding_advance,
      approverComments: data.approver_comments,
      checkerComments: data.checker_comments,
      approverId: data.approver_id,
      
      // Emergency Request fields - explicitly convert to ensure they're included
      emergencyReason: data.emergency_reason || null,
      emergencyReasonOther: data.emergency_reason_other || null,
      emergencyJustification: data.emergency_justification || null,
      emergencyAmount: data.emergency_amount || null,
      
      // Advance Request fields - explicitly convert to ensure they're included
      estimatedAmount: data.estimated_amount || null,
      advanceNotes: data.advance_notes || null,
      
      // Group Travel fields
      isGroupTravel: data.is_group_travel || false,
      isGroupCaptain: data.is_group_captain || false,
      groupSize: data.group_size || null,
      groupDescription: data.group_description || null,
      groupMembers: data.group_members ? JSON.parse(data.group_members) : [],
      
      // In-Valley specific fields
      expenseDate: data.expense_date || null,
      meetingType: data.meeting_type || null,
      meetingParticipants: data.meeting_participants || null,
      description: data.description || null,
      paymentMethod: data.payment_method || null,
      // paymentMethodOther: data.payment_method_other || null,
      
      // Timestamps
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      travel_details_approved_at: data.travel_details_approved_at || null,
      expenses_submitted_at: data.expenses_submitted_at || null,
    };
    
    // Log emergency/advance fields for debugging
    if (data.request_type === 'emergency') {
      console.log('Emergency request fields:', {
        emergencyReason: travelRequest.emergencyReason,
        emergencyReasonOther: travelRequest.emergencyReasonOther,
        emergencyJustification: travelRequest.emergencyJustification,
        emergencyAmount: travelRequest.emergencyAmount
      });
    } else if (data.request_type === 'advance') {
      console.log('Advance request fields:', {
        estimatedAmount: travelRequest.estimatedAmount,
        advanceNotes: travelRequest.advanceNotes
      });
    }
    
    return travelRequest;
  } catch (error) {
    console.error('Unexpected error in getTravelRequestById:', error);
    return null;
  }
}

// export const createTravelRequest = async (data: Omit<TravelRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
//   try {
//     // Ensure date conversion is correct - start with midnight for consistency
//     let travelDateFrom, travelDateTo;
    
//     try {
//       if (typeof data.travelDateFrom === 'string') {
//         // Ensure the date has a time component by adding T00:00:00Z
//         if (data.travelDateFrom.includes('T')) {
//           travelDateFrom = data.travelDateFrom;
//         } else {
//           travelDateFrom = `${data.travelDateFrom}T00:00:00Z`;
//         }
//       } else {
//         travelDateFrom = new Date(data.travelDateFrom).toISOString();
//       }
      
//       if (typeof data.travelDateTo === 'string') {
//         // Ensure the date has a time component by adding T00:00:00Z
//         if (data.travelDateTo.includes('T')) {
//           travelDateTo = data.travelDateTo;
//         } else {
//           travelDateTo = `${data.travelDateTo}T00:00:00Z`;
//         }
//       } else {
//         travelDateTo = new Date(data.travelDateTo).toISOString();
//       }
//     } catch (e: unknown) {
//       console.error('Date conversion error:', e);
//       const errorMessage = e instanceof Error ? e.message : 'Unknown error';
//       throw new Error(`Date conversion failed: ${errorMessage}`);
//     }

//     // Parse total amount to ensure it's a number
//     const totalAmount = typeof data.totalAmount === 'string' 
//       ? parseFloat(data.totalAmount) 
//       : data.totalAmount;
    
//     const previousAdvance = data.previousOutstandingAdvance
//       ? (typeof data.previousOutstandingAdvance === 'string'
//           ? parseFloat(data.previousOutstandingAdvance)
//           : data.previousOutstandingAdvance)
//       : 0;
    
//     // Process boolean fields
//     const rideShareUsed = data.rideShareUsed === true;
//     const ownVehicleReimbursement = data.ownVehicleReimbursement === true;
    
//     const insertData = {
//       employee_id: data.employeeId,
//       employee_name: data.employeeName,
//       department: data.department,
//       designation: data.designation,
//       purpose: data.purpose,
//       travel_date_from: travelDateFrom,
//       travel_date_to: travelDateTo,
//       total_amount: totalAmount,
//       status: data.status,
//       request_type: data.requestType,
//       previous_outstanding_advance: previousAdvance,
//       // Add new fields
//       project: data.project,
//       project_other: data.projectOther,
//       purpose_type: data.purposeType,
//       purpose_other: data.purposeOther,
//       location: data.location,
//       location_other: data.locationOther,
//       transport_mode: data.transportMode,
//       station_pick_drop: data.stationPickDrop,
//       local_conveyance: data.localConveyance,
//       ride_share_used: rideShareUsed,
//       own_vehicle_reimbursement: ownVehicleReimbursement,
//       // New fields for two-phase workflow
//       phase: data.phase || 1,
//       approver_id: data.approverId,

//       is_group_travel: data.isGroupTravel || false,
//       is_group_captain: data.isGroupCaptain || false,
//       group_size: data.groupSize || null,
//       group_members: data.groupMembers ? JSON.stringify(data.groupMembers) : null,
//       group_description: data.groupDescription || null,
//     };

//     console.log('Inserting travel request with data:', insertData);
    
//     const { data: newRequest, error } = await supabase
//       .from('travel_requests')
//       .insert([insertData])
//       .select()
//       .single();
    
//     if (error) {
//       console.error('Supabase error creating travel request:', error);
//       throw new Error(`Supabase error: ${error.message}`);
//     }
    
//     if (!newRequest) {
//       throw new Error('No data returned from travel request creation');
//     }
    
//     return mapDbToTravelRequest(newRequest);
//   } catch (error: unknown) {
//     console.error('Error in createTravelRequest:', error);
//     throw error;
//   }
// };

export async function createTravelRequest(data: Omit<TravelRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<TravelRequest> {
  console.log('Creating travel request with data:', data);
  
  try {
    // Convert camelCase fields to snake_case for database insertion
    const dbData = {
      id: uuidv4(),
      employee_id: data.employeeId,
      employee_name: data.employeeName,
      department: data.department,
      designation: data.designation,
      request_type: data.requestType,
      project: data.project,
      project_other: data.projectOther,
      purpose: data.purpose,
      purpose_type: data.purposeType,
      purpose_other: data.purposeOther,
      location: data.location,
      location_other: data.locationOther,
      travel_date_from: data.travelDateFrom,
      travel_date_to: data.travelDateTo,
      transport_mode: data.transportMode,
      station_pick_drop: data.stationPickDrop,
      local_conveyance: data.localConveyance,
      ride_share_used: data.rideShareUsed,
      own_vehicle_reimbursement: data.ownVehicleReimbursement,
      status: data.status,
      phase: data.phase,
      total_amount: data.totalAmount,
      approver_id: data.approverId,
      
      // Emergency Request fields
      emergency_reason: data.emergencyReason,
      emergency_reason_other: data.emergencyReasonOther,
      emergency_justification: data.emergencyJustification,
      emergency_amount: data.emergencyAmount,
      
      // Advance Request fields  
      estimated_amount: data.estimatedAmount,
      advance_notes: data.advanceNotes,
      
      // Group Travel fields
      is_group_travel: data.isGroupTravel,
      is_group_captain: data.isGroupCaptain,
      group_size: data.groupSize,
      group_description: data.groupDescription,
      group_members: data.groupMembers ? JSON.stringify(data.groupMembers) : null,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Prepared database data:', dbData);
    
    // Insert the travel request
    const { data: newRequest, error } = await supabase
      .from('travel_requests')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error creating travel request in database:', error);
      throw error;
    }
    
    console.log('Travel request created successfully:', newRequest);
    
    // Also create a notification for the user and approver
    try {
      // Create a notification for the employee
      await createNotification({
        userId: data.employeeId,
        requestId: newRequest.id,
        message: `Your ${data.requestType} travel request has been submitted and is awaiting approval.`,
      });
      
      // Create a notification for the approver
      let approverMessage = `A new travel request is waiting for your approval`;
      
      if (data.requestType === 'emergency') {
        approverMessage = `URGENT: An emergency travel request requires your immediate attention`;
      } else if (data.requestType === 'advance') {
        approverMessage = `An advance payment request is waiting for your approval`;
      } else if (data.requestType === 'group' && data.isGroupCaptain) {
        approverMessage = `A group travel request is waiting for your approval`;
      }
      
      await createNotification({
        userId: data.approverId,
        requestId: newRequest.id,
        message: approverMessage,
      });
      
      console.log('Notifications created for request');
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue despite notification error
    }

    // Convert snake_case back to camelCase for the returned object
    const formattedRequest: TravelRequest = {
      id: newRequest.id,
      employeeId: newRequest.employee_id,
      employeeName: newRequest.employee_name,
      department: newRequest.department,
      designation: newRequest.designation,
      requestType: newRequest.request_type,
      project: newRequest.project,
      projectOther: newRequest.project_other,
      purpose: newRequest.purpose,
      purposeType: newRequest.purpose_type,
      purposeOther: newRequest.purpose_other,
      location: newRequest.location,
      locationOther: newRequest.location_other,
      travelDateFrom: newRequest.travel_date_from,
      travelDateTo: newRequest.travel_date_to,
      transportMode: newRequest.transport_mode,
      stationPickDrop: newRequest.station_pick_drop,
      localConveyance: newRequest.local_conveyance,
      rideShareUsed: newRequest.ride_share_used,
      ownVehicleReimbursement: newRequest.own_vehicle_reimbursement,
      status: newRequest.status,
      phase: newRequest.phase,
      totalAmount: newRequest.total_amount,
      approverId: newRequest.approver_id,
      
      // Emergency Request fields
      emergencyReason: newRequest.emergency_reason,
      emergencyReasonOther: newRequest.emergency_reason_other,
      emergencyJustification: newRequest.emergency_justification,
      emergencyAmount: newRequest.emergency_amount,
      
      // Advance Request fields
      estimatedAmount: newRequest.estimated_amount,
      advanceNotes: newRequest.advance_notes,
      
      // Group Travel fields
      isGroupTravel: newRequest.is_group_travel,
      isGroupCaptain: newRequest.is_group_captain,
      groupSize: newRequest.group_size,
      groupDescription: newRequest.group_description,
      groupMembers: newRequest.group_members ? JSON.parse(newRequest.group_members) : [],
      
      createdAt: newRequest.created_at,
      updatedAt: newRequest.updated_at
    };
    
    return formattedRequest;
  } catch (error) {
    console.error('Error in createTravelRequest:', error);
    throw error;
  }
}

export const createTravelRequestPhase1 = async (data: any) => {
  try {
    // Process date fields
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

    // Parse numeric fields
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
      total_amount: 0, // Phase 1 has no amount yet
      status: 'pending',
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
      own_vehicle_reimbursement: ownVehicleReimbursement,
      // New fields for two-phase workflow
      phase: 1,
      approver_id: data.approverId
    };

    console.log('Inserting travel request (Phase 1) with data:', insertData);
    
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
    
    return mapDbToTravelRequest(newRequest);
  } catch (error: unknown) {
    console.error('Error in createTravelRequestPhase1:', error);
    throw error;
  }
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
    return mapDbToTravelRequest(updatedRequest);
  } catch (error) {
    console.error('Exception in updateTravelRequestStatus:', error);
    return null;
  }
};

export const updateTravelRequestWithExpenses = async (id: string, expenseData: any) => {
  try {
    const updateData = {
      total_amount: expenseData.totalAmount || 0,
      previous_outstanding_advance: expenseData.previousOutstandingAdvance || 0,
      status: 'pending_verification',
      phase: 2,
      expenses_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedRequest, error } = await supabase
      .from('travel_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating travel request with expenses:', error);
      return null;
    }
    
    return mapDbToTravelRequest(updatedRequest);
  } catch (error) {
    console.error('Exception in updateTravelRequestWithExpenses:', error);
    return null;
  }
};

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

// Receipts
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
    read: notification.read,
    createdAt: notification.created_at
  }));
};

export const createNotification = async (data: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
  const { data: newNotification, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: data.userId,
      request_id: data.requestId,
      message: data.message,
      read: false
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
    read: newNotification.read,
    createdAt: newNotification.created_at
  };
};

export const markNotificationAsRead = async (id: string) => {
  const { data: updatedNotification, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) return null;
  
  return {
    id: updatedNotification.id,
    userId: updatedNotification.user_id,
    requestId: updatedNotification.request_id,
    message: updatedNotification.message,
    read: updatedNotification.read,
    createdAt: updatedNotification.created_at
  };
};

// Phase-specific request functions
export const getTravelRequestsByPhase = async (employeeId: string, phase: number) => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('phase', phase)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  return data.map(mapDbToTravelRequest);
};

export const getRequestsAwaitingExpenses = async (employeeId: string) => {
  const { data: travelData, error: travelError } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'travel_approved')
    .order('created_at', { ascending: false });
  
  if (travelError) return [];
  
  const { data: valleyData, error: valleyError } = await supabase
    .from('valley_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'travel_approved')
    .order('created_at', { ascending: false });
  
  const travelRequests = travelData ? travelData.map(mapDbToTravelRequest) : [];
  const valleyRequests = valleyData ? valleyData.map(mapDbToValleyRequest) : [];
  
  return [...travelRequests, ...valleyRequests];
};

// Valley Requests Functions
export const getAllValleyRequests = async () => {
  const { data, error } = await supabase
    .from('valley_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data.map(mapDbToValleyRequest);
};

export const getValleyRequestsByEmployeeId = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('valley_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data.map(mapDbToValleyRequest);
};

export const getValleyRequestById = async (id: string) => {
  const { data, error } = await supabase
    .from('valley_requests')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return mapDbToValleyRequest(data);
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
      // Two-phase workflow support
      phase: data.phase || 1,
      approver_id: data.approverId
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
    
    return mapDbToValleyRequest(newRequest);
  } catch (error: unknown) {
    console.error('Error in createValleyRequest:', error);
    throw error;
  }
};

export const createValleyRequestPhase1 = async (data: any) => {
  try {
    // Process date fields
    let expenseDate;
    
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
      const travelDateFrom = expenseDate;
      const travelDateTo = expenseDate;
    } catch (e: unknown) {
      console.error('Date conversion error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      throw new Error(`Date conversion failed: ${errorMessage}`);
    }
    
    const insertData = {
      id: data.id || undefined, // Allow passing an existing ID
      employee_id: data.employeeId,
      employee_name: data.employeeName,
      department: data.department,
      designation: data.designation,
      purpose: data.purpose,
      travel_date_from: expenseDate,
      travel_date_to: expenseDate,
      expense_date: expenseDate,
      total_amount: 0, // Phase 1 has no amount yet
      status: 'pending',
      request_type: 'in-valley',
      project: data.project,
      description: data.description,
      location: data.location,
      meeting_type: data.meetingType,
      meeting_participants: data.meetingParticipants,
      payment_method: data.paymentMethod,
      // New fields for two-phase workflow
      phase: 1,
      approver_id: data.approverId
    };
    
    console.log('Inserting in-valley request (Phase 1) with data:', insertData);
    
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
    
    return mapDbToValleyRequest(newRequest);
  } catch (error: unknown) {
    console.error('Error in createValleyRequestPhase1:', error);
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
    return mapDbToValleyRequest(updatedRequest);
  } catch (error) {
    console.error('Exception in updateValleyRequestStatus:', error);
    return null;
  }
};

export const updateValleyRequestWithExpenses = async (id: string, expenseData: any) => {
  try {
    const updateData = {
      total_amount: expenseData.totalAmount || 0,
      status: 'pending_verification',
      phase: 2,
      expenses_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedRequest, error } = await supabase
      .from('valley_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating valley request with expenses:', error);
      return null;
    }
    
    return mapDbToValleyRequest(updatedRequest);
  } catch (error) {
    console.error('Exception in updateValleyRequestWithExpenses:', error);
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

// Checker functions
export const getPendingVerificationRequests = async () => {
  // Get travel requests
  const { data: travelData, error: travelError } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('status', 'pending_verification')
    .eq('phase', 2)
    .order('expenses_submitted_at', { ascending: false });
  
  // Get valley requests
  const { data: valleyData, error: valleyError } = await supabase
    .from('valley_requests')
    .select('*')
    .eq('status', 'pending_verification')
    .eq('phase', 2)
    .order('expenses_submitted_at', { ascending: false });
  
  const travelRequests = travelData ? travelData.map(mapDbToTravelRequest) : [];
  const valleyRequests = valleyData ? valleyData.map(mapDbToValleyRequest) : [];
  
  return [...travelRequests, ...valleyRequests];
};

export const getVerifiedRequestsByChecker = async () => {
  const { data, error } = await supabase
    .from('travel_requests')
    .select('*')
    .in('status', ['approved', 'rejected_by_checker'])
    .order('updated_at', { ascending: false });
  
  if (error) return [];
  return data.map(mapDbToTravelRequest);
};

// Approver functions
export const getPendingRequestsForApprover = async (approverId: string) => {
  // Get travel requests
  const { data: travelData, error: travelError } = await supabase
    .from('travel_requests')
    .select('*')
    .eq('approver_id', approverId)
    .eq('status', 'pending')
    .eq('phase', 1)
    .order('created_at', { ascending: false });
  
  // Get valley requests
  const { data: valleyData, error: valleyError } = await supabase
    .from('valley_requests')
    .select('*')
    .eq('approver_id', approverId)
    .eq('status', 'pending')
    .eq('phase', 1)
    .order('created_at', { ascending: false });
  
  const travelRequests = travelData ? travelData.map(mapDbToTravelRequest) : [];
  const valleyRequests = valleyData ? valleyData.map(mapDbToValleyRequest) : [];
  
  return [...travelRequests, ...valleyRequests];
};

// Project functions
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