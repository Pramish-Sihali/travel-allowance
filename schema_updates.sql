-- Schema Updates for Task Action Items Integration
-- This file contains SQL updates to support task action items using existing meeting_minutes table

-- Add task_id column to meeting_minutes table to support task action items
-- This allows the same table to handle both meeting action items and task action items
ALTER TABLE meeting_minutes 
ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Add index for better performance when querying task action items
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_task_id ON meeting_minutes(task_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_assigned_to ON meeting_minutes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_organization_id ON meeting_minutes(organization_id);

-- Add check constraint to ensure either meeting_id or task_id is set, but not both
ALTER TABLE meeting_minutes 
ADD CONSTRAINT check_meeting_or_task_id 
CHECK (
    (meeting_id IS NOT NULL AND task_id IS NULL) OR 
    (meeting_id IS NULL AND task_id IS NOT NULL)
);

-- Update existing records to ensure they comply with the new constraint
-- All existing records should have meeting_id, so they should be fine

-- Add comment to clarify the dual purpose of this table
COMMENT ON TABLE meeting_minutes IS 'Stores both meeting action items (when meeting_id is set) and task action items (when task_id is set)';
COMMENT ON COLUMN meeting_minutes.task_id IS 'References tasks table for task action items. Mutually exclusive with meeting_id';
COMMENT ON COLUMN meeting_minutes.meeting_id IS 'References meetings table for meeting action items. Mutually exclusive with task_id';

-- Add indexes for commonly queried combinations
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_type_assigned_org 
ON meeting_minutes(is_action_item, assigned_to, organization_id) 
WHERE is_action_item = true;

-- Drop existing views if they exist to avoid conflicts
DROP VIEW IF EXISTS task_action_items;
DROP VIEW IF EXISTS meeting_action_items;

-- Create views to make querying easier
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

-- Grant appropriate permissions if needed (uncomment and modify as needed)
-- GRANT SELECT ON task_action_items TO your_app_role;
-- GRANT SELECT ON meeting_action_items TO your_app_role;