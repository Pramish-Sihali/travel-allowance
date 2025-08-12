-- STEP 3: Create Missing task_action_items Table
-- This table is referenced in your schema files and code but doesn't exist in the main database
-- It's needed for task action items functionality

-- First, check if the table already exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'task_action_items';

-- Create the task_action_items table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT task_action_items_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
    CONSTRAINT task_action_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
    CONSTRAINT task_action_items_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_action_items_task_id ON public.task_action_items(task_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_assigned_to_id ON public.task_action_items(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_organization_id ON public.task_action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_status ON public.task_action_items(status);
CREATE INDEX IF NOT EXISTS idx_task_action_items_due_date ON public.task_action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_task_action_items_created_at ON public.task_action_items(created_at);

-- Add table and column comments for documentation
COMMENT ON TABLE public.task_action_items IS 'Action items for tasks (similar to meeting minutes but for tasks)';
COMMENT ON COLUMN public.task_action_items.task_id IS 'References tasks.id - the parent task';
COMMENT ON COLUMN public.task_action_items.assigned_to_id IS 'References users.id - who is responsible';
COMMENT ON COLUMN public.task_action_items.serial_no IS 'Sequential number within the task for ordering';
COMMENT ON COLUMN public.task_action_items.priority IS 'Priority level: Low, Medium, High, or Critical';
COMMENT ON COLUMN public.task_action_items.status IS 'Current status: Not Started, In Progress, or Completed';

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS task_action_items_updated_at_trigger ON public.task_action_items;
CREATE TRIGGER task_action_items_updated_at_trigger
    BEFORE UPDATE ON public.task_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_task_action_items_updated_at();

-- Verify the table was created successfully
SELECT 
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'task_action_items') as column_count,
    (SELECT count(*) FROM information_schema.table_constraints WHERE table_name = 'task_action_items' AND constraint_type = 'FOREIGN KEY') as foreign_key_count,
    (SELECT count(*) FROM pg_indexes WHERE tablename = 'task_action_items') as index_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'task_action_items';

-- Show the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_action_items'
ORDER BY ordinal_position;

-- Success message
SELECT 'Step 3 Complete: task_action_items table created successfully with all constraints and indexes' as status;