// types/index.ts

export type Role = 'employee' | 'approver';

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
  needsFinancialAttention?: boolean;
  isUrgent?: boolean;
  
  // Status and phase
  status: 'pending' | 'approved' | 'rejected' | 'travel_approved' | 'pending_verification' | 'rejected_by_checker';
  phase: number;
  
  // Approver information
  approverId: string;
  approverComments?: string;
  checkerComments?: string;
  financeComments?: string; 
  
  // Valley-specific fields
  expenseDate?: string;
  description?: string;
  paymentMethod?: string;
  meetingType?: string;
  meetingParticipants?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  travelDetailsApprovedAt?: string;
  expensesSubmittedAt?: string;
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
  isRead: boolean; // Updated to match database field name
  createdAt: string | Date;
  requestType?: string;
  organizationId?: string;
  metadata?: any;
}

// Auth Types
export type UserRole = 'employee' | 'approver';

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

export type EventType = 
  | 'company_meeting'    // Company Meetings - Admin/Approver only
  | 'hall_booking'      // Hall Bookings - All employees
  | 'potluck'           // Potluck/Social Events - All employees
  | 'training'          // Training Sessions - Admin/Approver only
  | 'holiday'           // Company Holidays - Admin/Approver only
  | 'deadline'          // Important Deadlines - Admin/Approver only
  | 'announcement'      // Company Announcements - Admin/Approver only
  | 'birthday'          // Birthday Celebrations - All employees
  | 'team_outing'       // Team Outings - All employees
  | 'workshop'          // Workshops - All employees
  | 'general';          // General Events - All employees

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string; // Time format: "14:30"
  endTime?: string; // Time format: "16:00"
  isAllDay?: boolean;
  eventType: EventType;
  location?: string;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  maxAttendees?: number;
  currentAttendees?: number;
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Task Manager Types
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type RagStatus = 'Red' | 'Amber' | 'Green' | 'Unrated';

export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  departmentId: string;
  departmentName?: string;
  assignedTo: string[];
  assignedUserIds?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  ragStatus: RagStatus;
  dueDate?: string;
  startDate?: string;
  completionDate?: string;
  bottlenecks?: string;
  ragTakeaway?: string;
  remarks?: string;
  createdBy?: string;
  createdByName?: string;
  lastUpdatedBy?: string;
  lastUpdatedByName?: string;
  createdAt: string;
  updatedAt: string;
  // Meeting action item fields (optional - only present for meeting action items)
  isMeetingActionItem?: boolean;
  meetingActionItemId?: string;
  meetingId?: string;
  meetingTitle?: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  updateType: string;
  oldValue?: string;
  newValue?: string;
  remarks?: string;
  updatedBy?: string;
  updatedByName: string;
  createdAt: string;
}

// Time Tracking Types
export interface TimeLog {
  id: string;
  userId: string;
  taskId?: string;
  organizationId: string;
  taskType: 'Desk Research' | 'Field Visit' | 'Report Writing' | 'Interview/Consultation Meetings' | 'Visuals and Designing' | 'Data Analysis/Interpretation' | 'Finance/Administrative Tasks';
  description: string;
  date: string; // Simple date field
  hoursSpent: number; // Simple numeric field for hours
  userName: string; // Display name for user
  createdAt: string;
  updatedAt: string;
  meetingActionItemId?: string;
  // Note: No longer using startTime, endTime, totalDuration, breakDuration, isPersonal
}

// Task Action Items Types  
export interface TaskActionItem {
  id: string;
  taskId: string;
  organizationId: string;
  serialNo: number;
  title: string;
  description?: string;
  assignedToId: string;
  assignedToName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Completed';
  dueDate?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
}

// Attendance Types
export type AttendanceStatus = 'present' | 'leave';
export type LeaveType = 'sick' | 'personal' | 'vacation' | 'emergency' | 'other';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: AttendanceStatus;
  leaveType?: LeaveType;
  leaveReason?: string;
  approver?: string;
  isAdvancedLeave?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  reason: string;
  approverId: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  isAdvanced?: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}