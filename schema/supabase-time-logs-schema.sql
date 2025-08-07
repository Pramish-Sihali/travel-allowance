-- Create time_logs table for tracking time spent on tasks
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) NOT NULL CHECK (task_type IN (
        'Desk Research',
        'Field Visit', 
        'Report Writing',
        'Interview/Consultation Meetings',
        'Visuals and Designing',
        'Data Analysis/Interpretation',
        'Finance/Administrative Tasks'
    )),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    hours_spent DECIMAL(4,2) NOT NULL CHECK (hours_spent > 0 AND hours_spent <= 24),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_type ON time_logs(task_type);

-- Enable RLS (Row Level Security)
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all time logs for tasks they have access to
CREATE POLICY "Users can view time logs for accessible tasks" ON time_logs
    FOR SELECT USING (true); -- For now, allow all authenticated users to view

-- Users can insert their own time logs
CREATE POLICY "Users can insert their own time logs" ON time_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own time logs
CREATE POLICY "Users can update their own time logs" ON time_logs
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own time logs
CREATE POLICY "Users can delete their own time logs" ON time_logs
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_time_logs_updated_at
    BEFORE UPDATE ON time_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_time_logs_updated_at();