// Updated types/index.ts with additional status for checker workflow

// Travel Request Types
export type RequestType = 'normal' | 'advance' | 'emergency';

export interface TravelRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  purpose: string;
  travelDateFrom: string | Date;
  travelDateTo: string | Date;
  totalAmount: number;
  status: 'pending' | 'pending_verification' | 'approved' | 'rejected' | 'rejected_by_checker';
  statusHistory?: {
    status: string;
    timestamp: string | Date;
    comments?: string;
    updatedBy?: string;
  }[];
  requestType: RequestType;
  previousOutstandingAdvance: number;
  // New fields
  project?: string;
  projectOther?: string;
  purposeType?: string;
  purposeOther?: string;
  location?: string;
  locationOther?: string;
  transportMode?: string;
  stationPickDrop?: string;
  localConveyance?: string;
  rideShareUsed?: boolean;
  ownVehicleReimbursement?: boolean;
  // Original fields
  createdAt: string | Date;
  updatedAt?: string | Date;
  comments?: string;
  approverComments?: string;
  checkerComments?: string;
}

// Expense Categories
export type ExpenseCategory = 'accommodation' | 'per-diem' | 'vehicle-hiring' | 'program-cost' | 'meeting-cost' | string;

export interface ExpenseItem {
  id: string;
  requestId: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
}

export interface Receipt {
  id: string;
  expenseItemId: string;
  originalFilename: string;
  storedFilename: string;
  fileType: string;
  uploadDate: string | Date;
}

export interface Notification {
  id: string;
  userId: string;
  requestId: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
}

// Auth Types
export type UserRole = 'employee' | 'approver' | 'checker' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  position?: string;
  createdAt: string | Date;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}