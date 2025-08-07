-- Simple script to create time_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    hours_spent DECIMAL(4,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);

-- Enable RLS
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all authenticated users to use time logs
DROP POLICY IF EXISTS "All users can view time logs" ON time_logs;
CREATE POLICY "All users can view time logs" ON time_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "All users can insert time logs" ON time_logs;  
CREATE POLICY "All users can insert time logs" ON time_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "All users can update time logs" ON time_logs;
CREATE POLICY "All users can update time logs" ON time_logs
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "All users can delete time logs" ON time_logs;
CREATE POLICY "All users can delete time logs" ON time_logs
    FOR DELETE USING (true);