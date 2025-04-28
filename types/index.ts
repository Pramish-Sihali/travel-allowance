// types/index.ts

export type Role = 'employee' | 'approver' | 'checker' | 'admin';

export type RequestStatus = 
  | 'pending' 
  | 'travel_approved'  // Phase 1 approved, ready for expense submission
  | 'pending_verification' 
  | 'approved' 
  | 'rejected' 
  | 'rejected_by_checker';

export type RequestType = 'normal' | 'advance' | 'emergency' | 'in-valley';

export type ExpenseCategory = 
  | 'accommodation' 
  | 'per-diem' 
  | 'vehicle-hiring' 
  | 'program-cost' 
  | 'meeting-cost' 
  | 'other'
  | 'ride-share'
  | 'taxi'
  | 'food'
  | 'meeting-venue'
  | 'stationery'
  | 'printing'
  | 'courier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  designation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TravelRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  requestType: 'normal' | 'advance' | 'emergency' | 'group' | 'in-valley';
  
  // Travel details
  project: string;
  projectOther?: string;
  purpose: string;
  purposeType?: string;
  purposeOther?: string;
  location: string;
  locationOther?: string;
  travelDateFrom: string;
  travelDateTo: string;
  
  // Transportation details
  transportMode: string;
  stationPickDrop: string;
  localConveyance: string;
  rideShareUsed: boolean;
  ownVehicleReimbursement: boolean;
  
  // Financial details
  totalAmount: number;
  previousOutstandingAdvance?: number;
  
  // Group travel details
  isGroupTravel?: boolean;
  isGroupCaptain?: boolean;
  groupSize?: string;
  groupMembers?: string[];
  groupDescription?: string;
  
  // Advance request details
  estimatedAmount?: string;
  advanceNotes?: string;
  
  // Emergency request details
  emergencyReason?: string;
  emergencyReasonOther?: string;
  emergencyJustification?: string;
  emergencyAmount?: string;

  
    
   
  
  // Processing flags
  needs_financial_attention?: boolean;
  is_urgent?: boolean;
  
  // Status and phase
  status: 'pending' | 'approved' | 'rejected' | 'travel_approved' | 'pending_verification' | 'rejected_by_checker';
  phase: number;
  
  // Approver information
  approverId: string;
  approverComments?: string;
  checkerComments?: string;
  finance_comments?: string; // Add this new field
  
  // Valley-specific fields
  expenseDate?: string;
  description?: string;
  paymentMethod?: string;
  meetingType?: string;
  meetingParticipants?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  travel_details_approved_at?: string;
  expenses_submitted_at?: string;
}

export interface ExpenseItem {
  id: string;
  requestId: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Receipt {
  id: string;
  expenseItemId: string;
  originalFilename: string;
  storedFilename: string;
  fileType: string;
  uploadDate?: string | Date;
  storagePath?: string;
  publicUrl?: string;
  createdAt?: string | Date;
}

export interface Notification {
  id: string;
  userId: string;
  requestId?: string;
  message: string;
  read: boolean; // Keep the original property name
  createdAt: string | Date;
}

// Auth Types
export type UserRole = 'employee' | 'approver' | 'checker' | 'admin';

export interface Project {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface Budget {
  id: string;
  projectId: string;
  amount: number;
  fiscalYear: number;
  description?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}