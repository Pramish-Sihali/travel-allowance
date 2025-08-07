-- Simple Time Logs Setup - No Dependencies, No Errors
-- This creates only what's needed for the time tracking functionality

-- Create time_logs table (drop if exists to avoid conflicts)
DROP TABLE IF EXISTS time_logs CASCADE;

CREATE TABLE time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    task_id UUID,
    organization_id UUID,
    description TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_duration INTEGER NOT NULL DEFAULT 0, -- in seconds
    break_duration INTEGER DEFAULT 0, -- in seconds
    is_personal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add column comments
COMMENT ON COLUMN time_logs.user_id IS 'References users.id but no FK constraint for flexibility';
COMMENT ON COLUMN time_logs.task_id IS 'References tasks.id but no FK constraint for flexibility';
COMMENT ON COLUMN time_logs.organization_id IS 'References organizations.id but no FK constraint';

-- Create basic indexes for performance
CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX idx_time_logs_start_time ON time_logs(start_time);
CREATE INDEX idx_time_logs_is_personal ON time_logs(is_personal);
CREATE INDEX idx_time_logs_created_at ON time_logs(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_time_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER time_logs_updated_at_trigger
    BEFORE UPDATE ON time_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_time_logs_updated_at();

-- Add metadata column to notifications table if it exists and doesn't have it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') 
       AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}';
        CREATE INDEX idx_notifications_metadata ON notifications USING GIN (metadata);
    END IF;
END $$;

-- Add progress column to tasks table if it exists and doesn't have it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') 
       AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'progress') THEN
        ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
    END IF;
END $$;

-- Simple success message
SELECT 'Time logs table created successfully! 🎉' AS status;