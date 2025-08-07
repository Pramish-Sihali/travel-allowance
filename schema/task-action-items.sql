-- Task Action Items Table
-- This table stores action items for each task (similar to meeting minutes structure)

-- Create task_action_items table
DROP TABLE IF EXISTS task_action_items CASCADE;

CREATE TABLE task_action_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    serial_no INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_id UUID NOT NULL,
    assigned_to_name TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Completed')) DEFAULT 'Not Started',
    due_date DATE,
    remarks TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE task_action_items IS 'Action items for tasks (similar to meeting minutes but for tasks)';
COMMENT ON COLUMN task_action_items.task_id IS 'References tasks.id but no FK constraint for flexibility';
COMMENT ON COLUMN task_action_items.assigned_to_id IS 'References users.id but no FK constraint for flexibility';
COMMENT ON COLUMN task_action_items.serial_no IS 'Sequential number within the task';

-- Create indexes for performance
CREATE INDEX idx_task_action_items_task_id ON task_action_items(task_id);
CREATE INDEX idx_task_action_items_assigned_to_id ON task_action_items(assigned_to_id);
CREATE INDEX idx_task_action_items_organization_id ON task_action_items(organization_id);
CREATE INDEX idx_task_action_items_status ON task_action_items(status);
CREATE INDEX idx_task_action_items_due_date ON task_action_items(due_date);
CREATE INDEX idx_task_action_items_created_at ON task_action_items(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_task_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER task_action_items_updated_at_trigger
    BEFORE UPDATE ON task_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_task_action_items_updated_at();

-- Success message
SELECT 'Task action items table created successfully! 🎯' AS status;