// types/index.ts

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type ExpenseCategory = 
  | 'accommodation' 
  | 'per-diem' 
  | 'vehicle-hiring' 
  | 'program-cost'
  | 'meeting-cost'
  | 'other';

export interface TravelRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  purpose: string;
  travelDateFrom: string;
  travelDateTo: string;
  totalAmount: number;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  previousOutstandingAdvance?: number;
}

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
  uploadDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  requestId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}