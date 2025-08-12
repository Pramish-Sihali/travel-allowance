-- STEP 5: Add Missing Indexes and Constraints
-- This improves query performance for your most common API operations
-- These indexes will make your APIs much faster

-- First, let's see what indexes currently exist on key tables
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('travel_requests', 'notifications', 'tasks', 'users', 'time_logs', 'meetings')
ORDER BY tablename, indexname;

-- Add performance indexes for travel_requests table (your main business table)
CREATE INDEX IF NOT EXISTS idx_travel_requests_employee_id ON public.travel_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_approver_id ON public.travel_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_status ON public.travel_requests(status);
CREATE INDEX IF NOT EXISTS idx_travel_requests_organization_id ON public.travel_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_phase ON public.travel_requests(phase);
CREATE INDEX IF NOT EXISTS idx_travel_requests_created_at ON public.travel_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_travel_requests_request_type ON public.travel_requests(request_type);

-- Add performance indexes for notifications table (frequently queried)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_request_type ON public.notifications(request_type);

-- Add performance indexes for tasks table (task management queries)
CREATE INDEX IF NOT EXISTS idx_tasks_department_id ON public.tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_id ON public.tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- Add performance indexes for users table (authentication and lookups)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email); -- Should already exist but let's ensure
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);

-- Add performance indexes for time_logs table (time tracking queries)
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON public.time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_organization_id ON public.time_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON public.time_logs(date);
CREATE INDEX IF NOT EXISTS idx_time_logs_created_at ON public.time_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_type ON public.time_logs(task_type);

-- Add performance indexes for meetings table (meeting management)
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_assigned_to ON public.meetings(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meetings_organization_id ON public.meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON public.meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_task_id ON public.meetings(task_id);

-- Add performance indexes for meeting_minutes table (action items queries)
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_id ON public.meeting_minutes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_assigned_to ON public.meeting_minutes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_is_action_item ON public.meeting_minutes(is_action_item);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_completion_status ON public.meeting_minutes(completion_status);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_organization_id ON public.meeting_minutes(organization_id);

-- Add performance indexes for other frequently queried tables
CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(is_active);

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(active);

CREATE INDEX IF NOT EXISTS idx_expense_items_request_id ON public.expense_items(request_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_organization_id ON public.expense_items(organization_id);

CREATE INDEX IF NOT EXISTS idx_valley_requests_employee_id ON public.valley_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_valley_requests_approver_id ON public.valley_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_valley_requests_status ON public.valley_requests(status);
CREATE INDEX IF NOT EXISTS idx_valley_requests_organization_id ON public.valley_requests(organization_id);

-- Add missing foreign key constraint for time_log_comments (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_log_comments_time_log_id_fkey'
    ) THEN
        ALTER TABLE public.time_log_comments 
        ADD CONSTRAINT time_log_comments_time_log_id_fkey 
        FOREIGN KEY (time_log_id) REFERENCES public.time_logs(id);
    END IF;
END $$;

-- Show summary of indexes created
SELECT 
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename IN ('travel_requests', 'notifications', 'tasks', 'users', 'time_logs', 'meetings', 'meeting_minutes')
GROUP BY tablename
ORDER BY tablename;

-- Success message
SELECT 'Step 5 Complete: Performance indexes and constraints added successfully' as status;