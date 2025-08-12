-- Ensure task_action_items table exists for task action items functionality
-- This script safely creates the task_action_items table if it doesn't exist

-- Create task_action_items table
CREATE TABLE IF NOT EXISTS public.task_action_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    serial_no INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_id UUID NOT NULL,
    assigned_to_name TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Completed')) DEFAULT 'Not Started',
    due_date DATE,
    remarks TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.task_action_items IS 'Action items for tasks (similar to meeting minutes but for tasks)';
COMMENT ON COLUMN public.task_action_items.task_id IS 'References tasks.id';
COMMENT ON COLUMN public.task_action_items.assigned_to_id IS 'References users.id';
COMMENT ON COLUMN public.task_action_items.serial_no IS 'Sequential number within the task';

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_task_action_items_task_id ON public.task_action_items(task_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_assigned_to_id ON public.task_action_items(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_organization_id ON public.task_action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_status ON public.task_action_items(status);
CREATE INDEX IF NOT EXISTS idx_task_action_items_due_date ON public.task_action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_task_action_items_created_at ON public.task_action_items(created_at);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_task_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Drop and recreate trigger to ensure it exists
DROP TRIGGER IF EXISTS task_action_items_updated_at_trigger ON public.task_action_items;
CREATE TRIGGER task_action_items_updated_at_trigger
    BEFORE UPDATE ON public.task_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_task_action_items_updated_at();

-- Enable Row Level Security
ALTER TABLE public.task_action_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view task action items for their organization" ON public.task_action_items;
DROP POLICY IF EXISTS "Users can insert task action items for their organization" ON public.task_action_items;
DROP POLICY IF EXISTS "Users can update task action items for their organization" ON public.task_action_items;
DROP POLICY IF EXISTS "Users can delete task action items for their organization" ON public.task_action_items;

-- Create RLS policies
CREATE POLICY "Users can view task action items for their organization" ON public.task_action_items
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert task action items for their organization" ON public.task_action_items
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update task action items for their organization" ON public.task_action_items
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete task action items for their organization" ON public.task_action_items
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Task action items table and RLS policies created successfully!';
    RAISE NOTICE '🎯 You can now add action items to tasks from the task detail page.';
END $$;