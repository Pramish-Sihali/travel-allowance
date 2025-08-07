-- Time Logs Table Schema Update
-- This creates the time_logs table if it doesn't exist and adds necessary indexes

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_duration INTEGER NOT NULL, -- in seconds
    break_duration INTEGER DEFAULT 0, -- in seconds
    is_personal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_organization_id ON time_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_time_logs_is_personal ON time_logs(is_personal);
CREATE INDEX IF NOT EXISTS idx_time_logs_created_at ON time_logs(created_at);

-- Add updated_at trigger
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

-- Add RLS policies for time_logs
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own time logs or admin can see all
DROP POLICY IF EXISTS "Users can view own time logs" ON time_logs;
CREATE POLICY "Users can view own time logs" ON time_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy: Users can insert their own time logs
DROP POLICY IF EXISTS "Users can insert own time logs" ON time_logs;
CREATE POLICY "Users can insert own time logs" ON time_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own time logs
DROP POLICY IF EXISTS "Users can update own time logs" ON time_logs;
CREATE POLICY "Users can update own time logs" ON time_logs
    FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own time logs
DROP POLICY IF EXISTS "Users can delete own time logs" ON time_logs;
CREATE POLICY "Users can delete own time logs" ON time_logs
    FOR DELETE USING (user_id = auth.uid());

-- Update notifications table to support task assignment notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for notifications metadata
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);

-- Add any missing columns to tasks table for better project management
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]';

-- Create a view for project dashboard that includes time tracking stats
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
    t.progress,
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
) tu ON t.id = tu.task_id;

-- Add any missing indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks USING GIN (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON task_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_created_at ON task_updates(created_at);

COMMENT ON TABLE time_logs IS 'Stores time tracking logs for both project work and personal activities';
COMMENT ON COLUMN time_logs.total_duration IS 'Total duration of the work session in seconds';
COMMENT ON COLUMN time_logs.break_duration IS 'Total break time during the session in seconds';
COMMENT ON COLUMN time_logs.is_personal IS 'Whether this is a personal log (not linked to a task)';
COMMENT ON VIEW project_dashboard IS 'Comprehensive project view with time tracking statistics';