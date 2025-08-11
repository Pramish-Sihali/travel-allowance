-- Fix time_logs table structure to match API expectations
-- This migration updates the existing time_logs table to match the expected schema

DO $$
BEGIN
    -- Check if we need to migrate the table structure
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'time_logs' AND column_name = 'date'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'time_logs' AND column_name = 'start_time'
    ) THEN
        
        RAISE NOTICE 'Migrating time_logs table structure...';
        
        -- Add new columns
        ALTER TABLE time_logs ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
        ALTER TABLE time_logs ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
        ALTER TABLE time_logs ADD COLUMN total_duration INTEGER DEFAULT 0; -- in seconds
        ALTER TABLE time_logs ADD COLUMN break_duration INTEGER DEFAULT 0; -- in seconds
        ALTER TABLE time_logs ADD COLUMN is_personal BOOLEAN DEFAULT FALSE;
        ALTER TABLE time_logs ADD COLUMN meeting_action_item_id UUID;
        
        -- Migrate existing data (convert date + hours_spent to start_time/end_time)
        UPDATE time_logs SET 
            start_time = date + TIME '09:00:00', -- Assume 9 AM start
            end_time = date + TIME '09:00:00' + (hours_spent || ' hours')::INTERVAL,
            total_duration = (hours_spent * 3600)::INTEGER, -- Convert hours to seconds
            is_personal = FALSE
        WHERE start_time IS NULL;
        
        -- Make new columns NOT NULL after migration
        ALTER TABLE time_logs ALTER COLUMN start_time SET NOT NULL;
        ALTER TABLE time_logs ALTER COLUMN end_time SET NOT NULL;
        ALTER TABLE time_logs ALTER COLUMN total_duration SET NOT NULL;
        
        -- Add foreign key constraint for meeting action items
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meeting_minutes') THEN
            ALTER TABLE time_logs ADD CONSTRAINT fk_time_logs_meeting_action_item_id 
                FOREIGN KEY (meeting_action_item_id) REFERENCES meeting_minutes(id) ON DELETE SET NULL;
        END IF;
        
        -- Create indexes for new columns
        CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
        CREATE INDEX IF NOT EXISTS idx_time_logs_meeting_action_item_id ON time_logs(meeting_action_item_id);
        CREATE INDEX IF NOT EXISTS idx_time_logs_is_personal ON time_logs(is_personal);
        
        -- Make task_id nullable since we can now have personal logs
        ALTER TABLE time_logs ALTER COLUMN task_id DROP NOT NULL;
        
        -- Keep old columns for now but comment them as deprecated
        COMMENT ON COLUMN time_logs.date IS 'DEPRECATED: Use start_time instead';
        COMMENT ON COLUMN time_logs.hours_spent IS 'DEPRECATED: Use total_duration instead';
        COMMENT ON COLUMN time_logs.task_type IS 'DEPRECATED: Task type is now determined by the linked task';
        
        RAISE NOTICE 'Migration completed successfully!';
        
    ELSIF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'time_logs' AND column_name = 'meeting_action_item_id'
    ) THEN
        
        RAISE NOTICE 'Adding missing meeting_action_item_id column...';
        
        -- Just add the missing meeting_action_item_id column
        ALTER TABLE time_logs ADD COLUMN meeting_action_item_id UUID;
        
        -- Add foreign key constraint
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meeting_minutes') THEN
            ALTER TABLE time_logs ADD CONSTRAINT fk_time_logs_meeting_action_item_id 
                FOREIGN KEY (meeting_action_item_id) REFERENCES meeting_minutes(id) ON DELETE SET NULL;
        END IF;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_time_logs_meeting_action_item_id ON time_logs(meeting_action_item_id);
        
        RAISE NOTICE 'Added meeting_action_item_id column successfully!';
        
    ELSE
        RAISE NOTICE 'time_logs table structure is already up to date.';
    END IF;
    
    -- Ensure organization_id column exists and is properly constrained
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'time_logs' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE time_logs ADD COLUMN organization_id UUID;
        
        -- Add foreign key constraint if organizations table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
            ALTER TABLE time_logs ADD CONSTRAINT fk_time_logs_organization_id 
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_time_logs_organization_id ON time_logs(organization_id);
    END IF;
    
END $$;

-- Update RLS policies to handle the new structure
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view time logs for accessible tasks" ON time_logs;
DROP POLICY IF EXISTS "Users can insert their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can update their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can delete their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can view own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can insert own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can update own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can delete own time logs" ON time_logs;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own time logs and admin access" ON time_logs
    FOR SELECT USING (
        user_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can insert own time logs" ON time_logs
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own time logs" ON time_logs
    FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own time logs" ON time_logs
    FOR DELETE USING (user_id::text = auth.uid()::text);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Time logs structure migration completed successfully!';
END $$;