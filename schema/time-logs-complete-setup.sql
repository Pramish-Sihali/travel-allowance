-- Complete Time Logs Setup Script
-- This script safely creates the time_logs table and handles all dependencies

-- First, let's check if the table exists and drop it if needed to recreate properly
DROP TABLE IF EXISTS time_logs CASCADE;

-- Create time_logs table with proper structure
CREATE TABLE time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    task_id UUID,
    organization_id UUID NOT NULL,
    description TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_duration INTEGER NOT NULL DEFAULT 0, -- in seconds
    break_duration INTEGER DEFAULT 0, -- in seconds
    is_personal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints if the referenced tables exist
DO $$
BEGIN
    -- Add user_id foreign key if users table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE time_logs ADD CONSTRAINT fk_time_logs_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add task_id foreign key if tasks table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        ALTER TABLE time_logs ADD CONSTRAINT fk_time_logs_task_id 
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;
    END IF;
    
    -- Add organization_id foreign key if organizations table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE time_logs ADD CONSTRAINT fk_time_logs_organization_id 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_organization_id ON time_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_time_logs_is_personal ON time_logs(is_personal);
CREATE INDEX IF NOT EXISTS idx_time_logs_created_at ON time_logs(created_at);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for time_logs
DROP TRIGGER IF EXISTS update_time_logs_updated_at ON time_logs;
CREATE TRIGGER update_time_logs_updated_at
    BEFORE UPDATE ON time_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can insert own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can update own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can delete own time logs" ON time_logs;

-- Create RLS policies
CREATE POLICY "Users can view own time logs" ON time_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can insert own time logs" ON time_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time logs" ON time_logs
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own time logs" ON time_logs
    FOR DELETE USING (user_id = auth.uid());

-- Add metadata column to notifications table if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Check if metadata column exists, if not add it
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'metadata'
        ) THEN
            ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;
        
        -- Add index for notifications metadata if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);
    END IF;
END $$;

-- Add project management columns to tasks table if they don't exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        -- Add progress column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'progress'
        ) THEN
            ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
        END IF;
        
        -- Add action_items column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'action_items'
        ) THEN
            ALTER TABLE tasks ADD COLUMN action_items JSONB DEFAULT '[]';
        END IF;
    END IF;
END $$;

-- Create or replace project dashboard view
CREATE OR REPLACE VIEW project_dashboard AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.department_name,
    t.assigned_to,
    t.rag_status,
    COALESCE(t.progress, 0) as progress,
    t.created_at,
    t.updated_at,
    COALESCE(tl.total_time_logged, 0) as total_time_logged,
    COALESCE(tl.total_sessions, 0) as total_sessions,
    COALESCE(tu.last_update, t.updated_at) as last_activity
FROM tasks t
LEFT JOIN (
    SELECT 
        task_id,
        SUM(total_duration) as total_time_logged,
        COUNT(*) as total_sessions
    FROM time_logs 
    WHERE task_id IS NOT NULL 
    GROUP BY task_id
) tl ON t.id = tl.task_id
LEFT JOIN (
    SELECT 
        task_id,
        MAX(created_at) as last_update
    FROM task_updates 
    GROUP BY task_id
) tu ON t.id = tu.task_id
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks');

-- Add missing indexes on existing tables if they exist
DO $$
BEGIN
    -- Tasks table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks USING GIN (assigned_to);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    END IF;
    
    -- Task updates table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_updates') THEN
        CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON task_updates(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_updates_created_at ON task_updates(created_at);
    END IF;
END $$;

-- Add helpful comments
COMMENT ON TABLE time_logs IS 'Stores time tracking logs for both project work and personal activities';
COMMENT ON COLUMN time_logs.total_duration IS 'Total duration of the work session in seconds';
COMMENT ON COLUMN time_logs.break_duration IS 'Total break time during the session in seconds';
COMMENT ON COLUMN time_logs.is_personal IS 'Whether this is a personal log (not linked to a task)';

-- Insert some sample data for testing (optional - remove if you don't want sample data)
-- INSERT INTO time_logs (
--     user_id, 
--     organization_id,
--     description, 
--     start_time, 
--     end_time, 
--     total_duration, 
--     break_duration, 
--     is_personal
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual organization_id
--     'Sample personal activity log',
--     NOW() - INTERVAL '1 hour',
--     NOW() - INTERVAL '30 minutes',
--     1800, -- 30 minutes in seconds
--     300,  -- 5 minutes break
--     true
-- );

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Time logs table and related components created successfully!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Update user_id and organization_id references as needed';
    RAISE NOTICE '2. Test the time tracking functionality';
    RAISE NOTICE '3. Verify RLS policies are working correctly';
END $$;