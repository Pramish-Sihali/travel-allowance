-- Fixed Schema Updates for Task Action Items Integration
-- This version handles the case where task_action_items exists as a table

-- Step 1: Add task_id column to meeting_minutes table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_minutes' AND column_name = 'task_id'
    ) THEN
        ALTER TABLE meeting_minutes ADD COLUMN task_id UUID;
    END IF;
END $$;

-- Step 2: Add foreign key constraint (only if it doesn't exist)
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

-- Step 5: Handle existing task_action_items (drop table if exists, then create view)
DO $$
BEGIN
    -- Check if task_action_items exists as a table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'task_action_items'
    ) THEN
        DROP TABLE task_action_items CASCADE;
    END IF;
    
    -- Check if task_action_items exists as a view and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'task_action_items'
    ) THEN
        DROP VIEW task_action_items CASCADE;
    END IF;
END $$;

-- Step 6: Handle existing meeting_action_items (drop table if exists, then create view)
DO $$
BEGIN
    -- Check if meeting_action_items exists as a table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'meeting_action_items'
    ) THEN
        DROP TABLE meeting_action_items CASCADE;
    END IF;
    
    -- Check if meeting_action_items exists as a view and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'meeting_action_items'
    ) THEN
        DROP VIEW meeting_action_items CASCADE;
    END IF;
END $$;

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

-- Step 9: Add helpful comments
COMMENT ON COLUMN meeting_minutes.task_id IS 'References tasks table for task action items. Mutually exclusive with meeting_id';
COMMENT ON VIEW task_action_items IS 'View showing action items linked to tasks';
COMMENT ON VIEW meeting_action_items IS 'View showing action items linked to meetings';

-- Step 10: Verification queries
SELECT 'meeting_minutes task_id column added' as status,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'meeting_minutes' AND column_name = 'task_id'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;

SELECT 'task_action_items view created' as status,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.views 
           WHERE table_name = 'task_action_items'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;

SELECT 'meeting_action_items view created' as status,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.views 
           WHERE table_name = 'meeting_action_items'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;