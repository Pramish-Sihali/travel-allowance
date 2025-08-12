-- Simple creation of task_action_items table
-- Run this first to create the table

CREATE TABLE public.task_action_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    serial_no INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_id UUID NOT NULL,
    assigned_to_name TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Not Started',
    due_date DATE,
    remarks TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints after table creation
ALTER TABLE public.task_action_items 
ADD CONSTRAINT check_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));

ALTER TABLE public.task_action_items 
ADD CONSTRAINT check_status CHECK (status IN ('Not Started', 'In Progress', 'Completed'));

-- Create basic indexes
CREATE INDEX idx_task_action_items_task_id ON public.task_action_items(task_id);
CREATE INDEX idx_task_action_items_organization_id ON public.task_action_items(organization_id);

-- Simple success message
SELECT 'Task action items table created successfully!' AS result;