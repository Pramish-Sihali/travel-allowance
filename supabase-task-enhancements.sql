-- Add approver information to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_by_id UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create time_log_comments table for commenting on time logs
CREATE TABLE IF NOT EXISTS time_log_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    time_log_id UUID NOT NULL REFERENCES time_logs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_log_comments_time_log_id ON time_log_comments(time_log_id);
CREATE INDEX IF NOT EXISTS idx_time_log_comments_user_id ON time_log_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_approved_by ON tasks(approved_by_id);

-- Enable RLS for time_log_comments
ALTER TABLE time_log_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_log_comments
CREATE POLICY "Users can view all time log comments" ON time_log_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON time_log_comments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own comments" ON time_log_comments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own comments" ON time_log_comments
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Update time_logs RLS policies to allow all users to add time logs
DROP POLICY IF EXISTS "Users can insert their own time logs" ON time_logs;
CREATE POLICY "Users can insert time logs for any task" ON time_logs
    FOR INSERT WITH CHECK (true); -- Allow all authenticated users to log time

DROP POLICY IF EXISTS "Users can update their own time logs" ON time_logs;
CREATE POLICY "Users can update time logs" ON time_logs
    FOR UPDATE USING (true); -- Allow all authenticated users to update time logs

DROP POLICY IF EXISTS "Users can delete their own time logs" ON time_logs;
CREATE POLICY "Users can delete time logs" ON time_logs
    FOR DELETE USING (true); -- Allow all authenticated users to delete time logs

-- Create trigger for time_log_comments updated_at
CREATE OR REPLACE FUNCTION update_time_log_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_time_log_comments_updated_at
    BEFORE UPDATE ON time_log_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_time_log_comments_updated_at();