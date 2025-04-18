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
  requestType: RequestType;
  project: string;
  purpose: string;
  location: string;
  travelDateFrom: string | Date;
  travelDateTo: string | Date;
  transportMode: string;
  stationPickDrop: string;
  localConveyance: string;
  rideShareUsed: boolean;
  ownVehicleReimbursement: boolean;
  totalAmount: number;
  previousOutstandingAdvance?: number;
  status: RequestStatus;
  approverComments?: string;
  checkerComments?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  
  // Fields for in-valley requests
  expenseDate?: string | Date;
  paymentMethod?: string;
  meetingType?: string;
  meetingParticipants?: string;
  description?: string;
  
  // New fields for two-phase workflow
  phase?: number; // 1 or 2
  approverId?: string;
  travelDetailsApprovedAt?: string | Date;
  expensesSubmittedAt?: string | Date;
  
  // Optional fields from form submission
  projectOther?: string;
  purposeType?: string;
  purposeOther?: string;
  locationOther?: string;
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