-- CRITICAL DATABASE FIXES
-- These fixes address immediate API confusion and dataflow issues
-- Run these scripts in order to fix blocking problems

-- ==================================================
-- 1. FIX NOTIFICATIONS TABLE DUPLICATE FIELDS
-- ==================================================

-- Remove the duplicate 'read' field, keep 'is_read' and rename it
ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;

-- ==================================================
-- 2. FIX TIME_LOGS TABLE STRUCTURE MISMATCH
-- ==================================================

-- Current time_logs table structure doesn't match what the code expects
-- The code expects these fields that are missing from current schema:
-- - task_type (with specific enum values)
-- - hours_spent (numeric)
-- - date (date)
-- - user_name (text)

-- Add missing fields that code expects
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS task_type character varying CHECK (task_type::text = ANY (ARRAY['Desk Research'::character varying, 'Field Visit'::character varying, 'Report Writing'::character varying, 'Interview/Consultation Meetings'::character varying, 'Visuals and Designing'::character varying, 'Data Analysis/Interpretation'::character varying, 'Finance/Administrative Tasks'::character varying]::text[]));

ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS hours_spent numeric CHECK (hours_spent > 0::numeric AND hours_spent <= 24::numeric);

ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS date date;

ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS user_name character varying;

-- Add foreign key constraint for time_logs.time_log_id that's missing
ALTER TABLE public.time_log_comments ADD CONSTRAINT time_log_comments_time_log_id_fkey FOREIGN KEY (time_log_id) REFERENCES public.time_logs(id);

-- ==================================================
-- 3. CREATE MISSING task_action_items TABLE
-- ==================================================

-- This table exists in your schema files but not in main database
CREATE TABLE IF NOT EXISTS public.task_action_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    serial_no INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_id UUID NOT NULL,
    assigned_to_name TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Completed')) DEFAULT 'Not Started',
    due_date DATE,
    remarks TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT task_action_items_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
    CONSTRAINT task_action_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
    CONSTRAINT task_action_items_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_action_items_task_id ON public.task_action_items(task_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_assigned_to_id ON public.task_action_items(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_organization_id ON public.task_action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_status ON public.task_action_items(status);
CREATE INDEX IF NOT EXISTS idx_task_action_items_due_date ON public.task_action_items(due_date);

-- ==================================================
-- 4. STANDARDIZE UUID GENERATION FUNCTIONS
-- ==================================================

-- Update tables using old uuid_generate_v4() to use gen_random_uuid()
-- This ensures consistency across all tables

-- budgets table
ALTER TABLE public.budgets ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- expense_items table  
ALTER TABLE public.expense_items ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- notifications table
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- projects table
ALTER TABLE public.projects ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- receipts table
ALTER TABLE public.receipts ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- travel_group_members table
ALTER TABLE public.travel_group_members ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- travel_requests table
ALTER TABLE public.travel_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- users table
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ==================================================
-- 5. FIX DATA TYPE INCONSISTENCIES
-- ==================================================

-- Fix employee_id fields that should be UUID but are text
-- NOTE: This requires data migration if there's existing data

-- leave_requests table - employee_id and approver_id should be UUID
-- ALTER TABLE public.leave_requests ALTER COLUMN employee_id TYPE uuid USING employee_id::uuid;
-- ALTER TABLE public.leave_requests ALTER COLUMN approver_id TYPE uuid USING approver_id::uuid;

-- attendance table - employee_id should be UUID  
-- ALTER TABLE public.attendance ALTER COLUMN employee_id TYPE uuid USING employee_id::uuid;

-- attendance_summary table - employee_id should be UUID
-- ALTER TABLE public.attendance_summary ALTER COLUMN employee_id TYPE uuid USING employee_id::uuid;

-- COMMENTED OUT: These changes require data migration
-- Uncomment and run only if you can safely convert existing text IDs to UUIDs

-- ==================================================
-- 6. ADD MISSING CONSTRAINTS AND RELATIONSHIPS
-- ==================================================

-- Add missing foreign key relationships that code expects
-- (Only if the relationships should exist based on your business logic)

-- meeting_minutes.task_id relationship (if it should reference tasks)
-- Already exists in your schema

-- Add proper indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_travel_requests_employee_id ON public.travel_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_approver_id ON public.travel_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_status ON public.travel_requests(status);
CREATE INDEX IF NOT EXISTS idx_travel_requests_organization_id ON public.travel_requests(organization_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_tasks_department_id ON public.tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- ==================================================
-- 7. UPDATE METADATA AND COMMENTS
-- ==================================================

-- Add table comments for documentation
COMMENT ON TABLE public.task_action_items IS 'Action items for tasks (similar to meeting minutes but for tasks)';
COMMENT ON COLUMN public.task_action_items.task_id IS 'References tasks.id';
COMMENT ON COLUMN public.task_action_items.assigned_to_id IS 'References users.id';
COMMENT ON COLUMN public.task_action_items.serial_no IS 'Sequential number within the task';

-- Add updated_at trigger for task_action_items
CREATE OR REPLACE FUNCTION update_task_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS task_action_items_updated_at_trigger ON public.task_action_items;
CREATE TRIGGER task_action_items_updated_at_trigger
    BEFORE UPDATE ON public.task_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_task_action_items_updated_at();

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Run these queries after the migration to verify everything is working:

-- 1. Check notifications table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications' AND column_name LIKE '%read%';

-- 2. Check time_logs table has required fields  
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'time_logs' AND column_name IN ('task_type', 'hours_spent', 'date', 'user_name');

-- 3. Check task_action_items table exists
-- SELECT count(*) FROM information_schema.tables WHERE table_name = 'task_action_items';

-- 4. Verify UUID generation consistency
-- SELECT table_name, column_name, column_default FROM information_schema.columns WHERE column_default LIKE '%uuid_generate_v4%';

-- ==================================================
-- ROLLBACK SCRIPTS (In case of issues)
-- ==================================================

-- If you need to rollback any changes, uncomment and run these:

-- Rollback notifications table
-- ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

-- Rollback time_logs table  
-- ALTER TABLE public.time_logs DROP COLUMN IF EXISTS task_type;
-- ALTER TABLE public.time_logs DROP COLUMN IF EXISTS hours_spent;
-- ALTER TABLE public.time_logs DROP COLUMN IF EXISTS date;
-- ALTER TABLE public.time_logs DROP COLUMN IF EXISTS user_name;

-- Rollback task_action_items table
-- DROP TABLE IF EXISTS public.task_action_items;

COMMIT;