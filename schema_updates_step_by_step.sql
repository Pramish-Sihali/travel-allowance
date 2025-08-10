-- Step-by-step Schema Updates for Task Action Items Integration
-- Run these commands one by one to avoid conflicts

-- Step 1: Add task_id column to meeting_minutes table
ALTER TABLE meeting_minutes 
ADD COLUMN IF NOT EXISTS task_id UUID;

-- Step 2: Add foreign key constraint (only if task_id column was just created)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'meeting_minutes_task_id_fkey' 
        AND table_name = 'meeting_minutes'
    ) THEN
        ALTER TABLE meeting_minutes 
        ADD CONSTRAINT meeting_minutes_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_task_id ON meeting_minutes(task_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_assigned_to ON meeting_minutes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_organization_id ON meeting_minutes(organization_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_type_assigned_org 
ON meeting_minutes(is_action_item, assigned_to, organization_id) 
WHERE is_action_item = true;

-- Step 4: Add check constraint (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_meeting_or_task_id' 
        AND table_name = 'meeting_minutes'
    ) THEN
        ALTER TABLE meeting_minutes 
        ADD CONSTRAINT check_meeting_or_task_id 
        CHECK (
            (meeting_id IS NOT NULL AND task_id IS NULL) OR 
            (meeting_id IS NULL AND task_id IS NOT NULL)
        );
    END IF;
END $$;

-- Step 5: Add comments
COMMENT ON COLUMN meeting_minutes.task_id IS 'References tasks table for task action items. Mutually exclusive with meeting_id';

-- Step 6: Drop existing views if they exist
DROP VIEW IF EXISTS task_action_items CASCADE;
DROP VIEW IF EXISTS meeting_action_items CASCADE;

-- Step 7: Create task_action_items view
CREATE VIEW task_action_items AS
SELECT 
    mm.id,
    mm.task_id,
    mm.content,
    mm.responsibility,
    mm.assigned_to,
    mm.assigned_to_name,
    mm.due_date,
    mm.priority,
    mm.completion_status,
    mm.is_done,
    mm.created_at,
    mm.updated_at,
    mm.created_by_name,
    mm.organization_id,
    t.title as task_title,
    t.department_id,
    d.name as department_name
FROM meeting_minutes mm
JOIN tasks t ON mm.task_id = t.id
LEFT JOIN departments d ON t.department_id = d.id
WHERE mm.task_id IS NOT NULL AND mm.is_action_item = true;

-- Step 8: Create meeting_action_items view
CREATE VIEW meeting_action_items AS
SELECT 
    mm.id,
    mm.meeting_id,
    mm.content,
    mm.responsibility,
    mm.assigned_to,
    mm.assigned_to_name,
    mm.due_date,
    mm.priority,
    mm.completion_status,
    mm.is_done,
    mm.created_at,
    mm.updated_at,
    mm.created_by_name,
    mm.organization_id,
    m.title as meeting_title,
    m.meeting_type,
    m.meeting_date
FROM meeting_minutes mm
JOIN meetings m ON mm.meeting_id = m.id
WHERE mm.meeting_id IS NOT NULL AND mm.is_action_item = true;

-- Step 9: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meeting_minutes' 
AND column_name = 'task_id';

-- Step 10: Test the views
SELECT COUNT(*) as meeting_action_items_count FROM meeting_action_items;
SELECT COUNT(*) as task_action_items_count FROM task_action_items;