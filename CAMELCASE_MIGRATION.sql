-- CAMELCASE MIGRATION SCRIPT
-- Convert database column names from snake_case to camelCase
-- This will eliminate the need for field transformations in your code

-- ==================================================
-- IMPORTANT: BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT
-- ==================================================

-- ==================================================
-- PHASE 1: CORE AUTHENTICATION TABLE (users)
-- ==================================================

-- users table - Core authentication
ALTER TABLE public.users RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.users RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.users RENAME COLUMN organization_id TO organizationId;

-- Update foreign key constraint names to match new column names
-- (Foreign key names will automatically update with column renames)

-- ==================================================
-- PHASE 2: MAIN BUSINESS LOGIC TABLE (travel_requests)  
-- ==================================================

-- travel_requests table - Main business functionality
ALTER TABLE public.travel_requests RENAME COLUMN employee_id TO employeeId;
ALTER TABLE public.travel_requests RENAME COLUMN employee_name TO employeeName;
ALTER TABLE public.travel_requests RENAME COLUMN travel_date_from TO travelDateFrom;
ALTER TABLE public.travel_requests RENAME COLUMN travel_date_to TO travelDateTo;
ALTER TABLE public.travel_requests RENAME COLUMN total_amount TO totalAmount;
ALTER TABLE public.travel_requests RENAME COLUMN request_type TO requestType;
ALTER TABLE public.travel_requests RENAME COLUMN previous_outstanding_advance TO previousOutstandingAdvance;
ALTER TABLE public.travel_requests RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.travel_requests RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.travel_requests RENAME COLUMN approver_comments TO approverComments;
ALTER TABLE public.travel_requests RENAME COLUMN checker_comments TO checkerComments;
ALTER TABLE public.travel_requests RENAME COLUMN project_other TO projectOther;
ALTER TABLE public.travel_requests RENAME COLUMN purpose_type TO purposeType;
ALTER TABLE public.travel_requests RENAME COLUMN purpose_other TO purposeOther;
ALTER TABLE public.travel_requests RENAME COLUMN location_other TO locationOther;
ALTER TABLE public.travel_requests RENAME COLUMN transport_mode TO transportMode;
ALTER TABLE public.travel_requests RENAME COLUMN station_pick_drop TO stationPickDrop;
ALTER TABLE public.travel_requests RENAME COLUMN local_conveyance TO localConveyance;
ALTER TABLE public.travel_requests RENAME COLUMN ride_share_used TO rideShareUsed;
ALTER TABLE public.travel_requests RENAME COLUMN own_vehicle_reimbursement TO ownVehicleReimbursement;
ALTER TABLE public.travel_requests RENAME COLUMN approver_id TO approverId;
ALTER TABLE public.travel_requests RENAME COLUMN travel_details_approved_at TO travelDetailsApprovedAt;
ALTER TABLE public.travel_requests RENAME COLUMN expenses_submitted_at TO expensesSubmittedAt;
ALTER TABLE public.travel_requests RENAME COLUMN status_id TO statusId;
ALTER TABLE public.travel_requests RENAME COLUMN is_group_travel TO isGroupTravel;
ALTER TABLE public.travel_requests RENAME COLUMN is_group_captain TO isGroupCaptain;
ALTER TABLE public.travel_requests RENAME COLUMN group_size TO groupSize;
ALTER TABLE public.travel_requests RENAME COLUMN group_description TO groupDescription;
ALTER TABLE public.travel_requests RENAME COLUMN group_members TO groupMembers;
ALTER TABLE public.travel_requests RENAME COLUMN estimated_amount TO estimatedAmount;
ALTER TABLE public.travel_requests RENAME COLUMN advance_notes TO advanceNotes;
ALTER TABLE public.travel_requests RENAME COLUMN emergency_reason TO emergencyReason;
ALTER TABLE public.travel_requests RENAME COLUMN emergency_reason_other TO emergencyReasonOther;
ALTER TABLE public.travel_requests RENAME COLUMN emergency_justification TO emergencyJustification;
ALTER TABLE public.travel_requests RENAME COLUMN emergency_amount TO emergencyAmount;
ALTER TABLE public.travel_requests RENAME COLUMN needs_financial_attention TO needsFinancialAttention;
ALTER TABLE public.travel_requests RENAME COLUMN is_urgent TO isUrgent;
ALTER TABLE public.travel_requests RENAME COLUMN finance_comments TO financeComments;
ALTER TABLE public.travel_requests RENAME COLUMN organization_id TO organizationId;

-- ==================================================
-- PHASE 3: USER INTERACTION TABLE (notifications)
-- ==================================================

-- notifications table
ALTER TABLE public.notifications RENAME COLUMN user_id TO userId;
ALTER TABLE public.notifications RENAME COLUMN request_id TO requestId;
ALTER TABLE public.notifications RENAME COLUMN is_read TO isRead;  -- We kept this field, rename to camelCase
ALTER TABLE public.notifications RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.notifications RENAME COLUMN request_type TO requestType;
ALTER TABLE public.notifications RENAME COLUMN organization_id TO organizationId;

-- ==================================================
-- PHASE 4: TASK MANAGEMENT TABLE (tasks)
-- ==================================================

-- tasks table
ALTER TABLE public.tasks RENAME COLUMN department_id TO departmentId;
ALTER TABLE public.tasks RENAME COLUMN assigned_to TO assignedTo;
ALTER TABLE public.tasks RENAME COLUMN assigned_user_ids TO assignedUserIds;
ALTER TABLE public.tasks RENAME COLUMN rag_status TO ragStatus;
ALTER TABLE public.tasks RENAME COLUMN due_date TO dueDate;
ALTER TABLE public.tasks RENAME COLUMN start_date TO startDate;
ALTER TABLE public.tasks RENAME COLUMN completion_date TO completionDate;
ALTER TABLE public.tasks RENAME COLUMN rag_takeaway TO ragTakeaway;
ALTER TABLE public.tasks RENAME COLUMN created_by TO createdBy;
ALTER TABLE public.tasks RENAME COLUMN created_by_name TO createdByName;
ALTER TABLE public.tasks RENAME COLUMN last_updated_by TO lastUpdatedBy;
ALTER TABLE public.tasks RENAME COLUMN last_updated_by_name TO lastUpdatedByName;
ALTER TABLE public.tasks RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.tasks RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.tasks RENAME COLUMN created_by_id TO createdById;
ALTER TABLE public.tasks RENAME COLUMN approved_by_id TO approvedById;
ALTER TABLE public.tasks RENAME COLUMN approved_by_name TO approvedByName;
ALTER TABLE public.tasks RENAME COLUMN approved_at TO approvedAt;
ALTER TABLE public.tasks RENAME COLUMN organization_id TO organizationId;

-- ==================================================
-- PHASE 5: TIME TRACKING TABLE (time_logs)
-- ==================================================

-- time_logs table
ALTER TABLE public.time_logs RENAME COLUMN user_id TO userId;
ALTER TABLE public.time_logs RENAME COLUMN task_id TO taskId;
ALTER TABLE public.time_logs RENAME COLUMN organization_id TO organizationId;
ALTER TABLE public.time_logs RENAME COLUMN start_time TO startTime;
ALTER TABLE public.time_logs RENAME COLUMN end_time TO endTime;
ALTER TABLE public.time_logs RENAME COLUMN total_duration TO totalDuration;
ALTER TABLE public.time_logs RENAME COLUMN break_duration TO breakDuration;
ALTER TABLE public.time_logs RENAME COLUMN is_personal TO isPersonal;
ALTER TABLE public.time_logs RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.time_logs RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.time_logs RENAME COLUMN meeting_action_item_id TO meetingActionItemId;
ALTER TABLE public.time_logs RENAME COLUMN task_type TO taskType;
ALTER TABLE public.time_logs RENAME COLUMN hours_spent TO hoursSpent;
ALTER TABLE public.time_logs RENAME COLUMN user_name TO userName;

-- ==================================================
-- PHASE 6: SUPPORTING TABLES
-- ==================================================

-- organizations table
ALTER TABLE public.organizations RENAME COLUMN is_active TO isActive;
ALTER TABLE public.organizations RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.organizations RENAME COLUMN updated_at TO updatedAt;

-- projects table  
ALTER TABLE public.projects RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.projects RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.projects RENAME COLUMN organization_id TO organizationId;

-- departments table
ALTER TABLE public.departments RENAME COLUMN is_active TO isActive;
ALTER TABLE public.departments RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.departments RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.departments RENAME COLUMN organization_id TO organizationId;

-- budgets table
ALTER TABLE public.budgets RENAME COLUMN project_id TO projectId;
ALTER TABLE public.budgets RENAME COLUMN fiscal_year TO fiscalYear;
ALTER TABLE public.budgets RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.budgets RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.budgets RENAME COLUMN organization_id TO organizationId;

-- expense_items table
ALTER TABLE public.expense_items RENAME COLUMN request_id TO requestId;
ALTER TABLE public.expense_items RENAME COLUMN organization_id TO organizationId;

-- receipts table
ALTER TABLE public.receipts RENAME COLUMN expense_item_id TO expenseItemId;
ALTER TABLE public.receipts RENAME COLUMN original_filename TO originalFilename;
ALTER TABLE public.receipts RENAME COLUMN stored_filename TO storedFilename;
ALTER TABLE public.receipts RENAME COLUMN file_type TO fileType;
ALTER TABLE public.receipts RENAME COLUMN upload_date TO uploadDate;
ALTER TABLE public.receipts RENAME COLUMN storage_path TO storagePath;
ALTER TABLE public.receipts RENAME COLUMN public_url TO publicUrl;
ALTER TABLE public.receipts RENAME COLUMN organization_id TO organizationId;

-- ==================================================
-- PHASE 7: MEETING-RELATED TABLES
-- ==================================================

-- meetings table
ALTER TABLE public.meetings RENAME COLUMN task_id TO taskId;
ALTER TABLE public.meetings RENAME COLUMN meeting_type TO meetingType;
ALTER TABLE public.meetings RENAME COLUMN client_id TO clientId;
ALTER TABLE public.meetings RENAME COLUMN location_type TO locationType;
ALTER TABLE public.meetings RENAME COLUMN location_address TO locationAddress;
ALTER TABLE public.meetings RENAME COLUMN meeting_date TO meetingDate;
ALTER TABLE public.meetings RENAME COLUMN meeting_time TO meetingTime;
ALTER TABLE public.meetings RENAME COLUMN duration_minutes TO durationMinutes;
ALTER TABLE public.meetings RENAME COLUMN created_by TO createdBy;
ALTER TABLE public.meetings RENAME COLUMN created_by_name TO createdByName;
ALTER TABLE public.meetings RENAME COLUMN assigned_to TO assignedTo;
ALTER TABLE public.meetings RENAME COLUMN assigned_to_name TO assignedToName;
ALTER TABLE public.meetings RENAME COLUMN deadline_date TO deadlineDate;
ALTER TABLE public.meetings RENAME COLUMN deadline_time TO deadlineTime;
ALTER TABLE public.meetings RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.meetings RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.meetings RENAME COLUMN organization_id TO organizationId;

-- meeting_minutes table
ALTER TABLE public.meeting_minutes RENAME COLUMN meeting_id TO meetingId;
ALTER TABLE public.meeting_minutes RENAME COLUMN minute_order TO minuteOrder;
ALTER TABLE public.meeting_minutes RENAME COLUMN is_action_item TO isActionItem;
ALTER TABLE public.meeting_minutes RENAME COLUMN assigned_to TO assignedTo;
ALTER TABLE public.meeting_minutes RENAME COLUMN assigned_to_name TO assignedToName;
ALTER TABLE public.meeting_minutes RENAME COLUMN due_date TO dueDate;
ALTER TABLE public.meeting_minutes RENAME COLUMN due_time TO dueTime;
ALTER TABLE public.meeting_minutes RENAME COLUMN completion_status TO completionStatus;
ALTER TABLE public.meeting_minutes RENAME COLUMN completion_percentage TO completionPercentage;
ALTER TABLE public.meeting_minutes RENAME COLUMN estimated_hours TO estimatedHours;
ALTER TABLE public.meeting_minutes RENAME COLUMN actual_hours TO actualHours;
ALTER TABLE public.meeting_minutes RENAME COLUMN deadline_notes TO deadlineNotes;
ALTER TABLE public.meeting_minutes RENAME COLUMN reminder_sent TO reminderSent;
ALTER TABLE public.meeting_minutes RENAME COLUMN reminder_date TO reminderDate;
ALTER TABLE public.meeting_minutes RENAME COLUMN completed_at TO completedAt;
ALTER TABLE public.meeting_minutes RENAME COLUMN completed_by TO completedBy;
ALTER TABLE public.meeting_minutes RENAME COLUMN completed_by_name TO completedByName;
ALTER TABLE public.meeting_minutes RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.meeting_minutes RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.meeting_minutes RENAME COLUMN organization_id TO organizationId;
ALTER TABLE public.meeting_minutes RENAME COLUMN serial_no TO serialNo;
ALTER TABLE public.meeting_minutes RENAME COLUMN is_done TO isDone;
ALTER TABLE public.meeting_minutes RENAME COLUMN toggled_by TO toggledBy;
ALTER TABLE public.meeting_minutes RENAME COLUMN toggled_at TO toggledAt;
ALTER TABLE public.meeting_minutes RENAME COLUMN created_by_name TO createdByName;
ALTER TABLE public.meeting_minutes RENAME COLUMN updated_by_name TO updatedByName;
ALTER TABLE public.meeting_minutes RENAME COLUMN task_id TO taskId;

-- meeting_attendees table
ALTER TABLE public.meeting_attendees RENAME COLUMN meeting_id TO meetingId;
ALTER TABLE public.meeting_attendees RENAME COLUMN user_id TO userId;
ALTER TABLE public.meeting_attendees RENAME COLUMN attendee_name TO attendeeName;
ALTER TABLE public.meeting_attendees RENAME COLUMN attendee_email TO attendeeEmail;
ALTER TABLE public.meeting_attendees RENAME COLUMN attendee_organization TO attendeeOrganization;
ALTER TABLE public.meeting_attendees RENAME COLUMN attendee_type TO attendeeType;
ALTER TABLE public.meeting_attendees RENAME COLUMN attendance_status TO attendanceStatus;
ALTER TABLE public.meeting_attendees RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.meeting_attendees RENAME COLUMN organization_id TO organizationId;

-- ==================================================
-- PHASE 8: REMAINING TABLES
-- ==================================================

-- attendance table
ALTER TABLE public.attendance RENAME COLUMN employee_id TO employeeId;
ALTER TABLE public.attendance RENAME COLUMN employee_name TO employeeName;
ALTER TABLE public.attendance RENAME COLUMN leave_type TO leaveType;
ALTER TABLE public.attendance RENAME COLUMN leave_reason TO leaveReason;
ALTER TABLE public.attendance RENAME COLUMN is_advanced_leave TO isAdvancedLeave;
ALTER TABLE public.attendance RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.attendance RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.attendance RENAME COLUMN organization_id TO organizationId;

-- valley_requests table
ALTER TABLE public.valley_requests RENAME COLUMN employee_id TO employeeId;
ALTER TABLE public.valley_requests RENAME COLUMN employee_name TO employeeName;
ALTER TABLE public.valley_requests RENAME COLUMN request_type TO requestType;
ALTER TABLE public.valley_requests RENAME COLUMN expense_date TO expenseDate;
ALTER TABLE public.valley_requests RENAME COLUMN payment_method TO paymentMethod;
ALTER TABLE public.valley_requests RENAME COLUMN meeting_type TO meetingType;
ALTER TABLE public.valley_requests RENAME COLUMN meeting_participants TO meetingParticipants;
ALTER TABLE public.valley_requests RENAME COLUMN total_amount TO totalAmount;
ALTER TABLE public.valley_requests RENAME COLUMN approver_comments TO approverComments;
ALTER TABLE public.valley_requests RENAME COLUMN checker_comments TO checkerComments;
ALTER TABLE public.valley_requests RENAME COLUMN travel_date_from TO travelDateFrom;
ALTER TABLE public.valley_requests RENAME COLUMN travel_date_to TO travelDateTo;
ALTER TABLE public.valley_requests RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.valley_requests RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.valley_requests RENAME COLUMN travel_details_approved_at TO travelDetailsApprovedAt;
ALTER TABLE public.valley_requests RENAME COLUMN expenses_submitted_at TO expensesSubmittedAt;
ALTER TABLE public.valley_requests RENAME COLUMN approver_id TO approverId;
ALTER TABLE public.valley_requests RENAME COLUMN emergency_reason TO emergencyReason;
ALTER TABLE public.valley_requests RENAME COLUMN emergency_reason_other TO emergencyReasonOther;
ALTER TABLE public.valley_requests RENAME COLUMN emergency_justification TO emergencyJustification;
ALTER TABLE public.valley_requests RENAME COLUMN emergency_amount TO emergencyAmount;
ALTER TABLE public.valley_requests RENAME COLUMN needs_financial_attention TO needsFinancialAttention;
ALTER TABLE public.valley_requests RENAME COLUMN is_urgent TO isUrgent;
ALTER TABLE public.valley_requests RENAME COLUMN finance_comments TO financeComments;
ALTER TABLE public.valley_requests RENAME COLUMN organization_id TO organizationId;

-- valley_expenses table
ALTER TABLE public.valley_expenses RENAME COLUMN request_id TO requestId;
ALTER TABLE public.valley_expenses RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.valley_expenses RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.valley_expenses RENAME COLUMN organization_id TO organizationId;

-- events table
ALTER TABLE public.events RENAME COLUMN start_date TO startDate;
ALTER TABLE public.events RENAME COLUMN end_date TO endDate;
ALTER TABLE public.events RENAME COLUMN start_time TO startTime;
ALTER TABLE public.events RENAME COLUMN end_time TO endTime;
ALTER TABLE public.events RENAME COLUMN is_all_day TO isAllDay;
ALTER TABLE public.events RENAME COLUMN event_type TO eventType;
ALTER TABLE public.events RENAME COLUMN hall_id TO hallId;
ALTER TABLE public.events RENAME COLUMN created_by TO createdBy;
ALTER TABLE public.events RENAME COLUMN created_by_name TO createdByName;
ALTER TABLE public.events RENAME COLUMN created_by_role TO createdByRole;
ALTER TABLE public.events RENAME COLUMN is_recurring TO isRecurring;
ALTER TABLE public.events RENAME COLUMN recurring_pattern TO recurringPattern;
ALTER TABLE public.events RENAME COLUMN max_attendees TO maxAttendees;
ALTER TABLE public.events RENAME COLUMN current_attendees TO currentAttendees;
ALTER TABLE public.events RENAME COLUMN requires_approval TO requiresApproval;
ALTER TABLE public.events RENAME COLUMN approved_by TO approvedBy;
ALTER TABLE public.events RENAME COLUMN approval_status TO approvalStatus;
ALTER TABLE public.events RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.events RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.events RENAME COLUMN organization_id TO organizationId;

-- clients table
ALTER TABLE public.clients RENAME COLUMN client_type TO clientType;
ALTER TABLE public.clients RENAME COLUMN contact_person TO contactPerson;
ALTER TABLE public.clients RENAME COLUMN is_active TO isActive;
ALTER TABLE public.clients RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.clients RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.clients RENAME COLUMN organization_id TO organizationId;

-- halls table
ALTER TABLE public.halls RENAME COLUMN is_active TO isActive;
ALTER TABLE public.halls RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.halls RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE public.halls RENAME COLUMN organization_id TO organizationId;

-- task_action_items table (if created from previous script)
ALTER TABLE public.task_action_items RENAME COLUMN task_id TO taskId;
ALTER TABLE public.task_action_items RENAME COLUMN organization_id TO organizationId;
ALTER TABLE public.task_action_items RENAME COLUMN serial_no TO serialNo;
ALTER TABLE public.task_action_items RENAME COLUMN assigned_to_id TO assignedToId;
ALTER TABLE public.task_action_items RENAME COLUMN assigned_to_name TO assignedToName;
ALTER TABLE public.task_action_items RENAME COLUMN due_date TO dueDate;
ALTER TABLE public.task_action_items RENAME COLUMN created_by TO createdBy;
ALTER TABLE public.task_action_items RENAME COLUMN created_at TO createdAt;
ALTER TABLE public.task_action_items RENAME COLUMN updated_by TO updatedBy;
ALTER TABLE public.task_action_items RENAME COLUMN updated_at TO updatedAt;

-- ==================================================
-- UPDATE INDEXES TO MATCH NEW COLUMN NAMES
-- ==================================================

-- Drop old indexes and create new ones with correct column names
-- (Most indexes will automatically update, but we'll recreate key performance indexes)

-- Drop old indexes that might not auto-update
DROP INDEX IF EXISTS idx_travel_requests_employee_id;
DROP INDEX IF EXISTS idx_travel_requests_approver_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_tasks_department_id;

-- Recreate with new column names
CREATE INDEX IF NOT EXISTS idx_travel_requests_employeeId ON public.travel_requests(employeeId);
CREATE INDEX IF NOT EXISTS idx_travel_requests_approverId ON public.travel_requests(approverId);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON public.notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON public.notifications(isRead);
CREATE INDEX IF NOT EXISTS idx_tasks_departmentId ON public.tasks(departmentId);

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Run these after migration to verify the changes:

-- 1. Check key tables have camelCase columns
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'travel_requests' AND column_name LIKE '%Date%';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE '%Id';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'isRead';

-- 2. Verify foreign key constraints still work
-- SELECT constraint_name, table_name, column_name FROM information_schema.key_column_usage WHERE table_name IN ('travel_requests', 'notifications', 'tasks');

-- Success message
SELECT 'Database successfully converted to camelCase naming convention!' AS migration_status;

COMMIT;