-- Add support for meeting action items in time logs
-- Add meeting_action_item_id column to time_logs table
DO $$
BEGIN
    -- Add meeting_action_item_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'time_logs' AND column_name = 'meeting_action_item_id'
    ) THEN
        ALTER TABLE time_logs ADD COLUMN meeting_action_item_id UUID;
        
        -- Add foreign key constraint if meeting_minutes table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meeting_minutes') THEN
            ALTER TABLE time_logs ADD CONSTRAINT fk_time_logs_meeting_action_item_id 
                FOREIGN KEY (meeting_action_item_id) REFERENCES meeting_minutes(id) ON DELETE SET NULL;
        END IF;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_time_logs_meeting_action_item_id ON time_logs(meeting_action_item_id);
        
        RAISE NOTICE 'Added meeting_action_item_id column to time_logs table';
    ELSE
        RAISE NOTICE 'meeting_action_item_id column already exists in time_logs table';
    END IF;
END $$;

-- Update the view or query logic to handle both task_id and meeting_action_item_id
-- This helps with backwards compatibility

-- Add comment to document the new field
COMMENT ON COLUMN time_logs.meeting_action_item_id IS 'Links time log to a meeting action item from meeting_minutes table';