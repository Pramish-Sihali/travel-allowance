-- STEP 3 FIX: Handle existing view issue
-- It seems there's already a view named task_action_items, we need to handle this

-- First, let's check what exists with the name task_action_items
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'task_action_items';

-- Check if it's a view
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_name = 'task_action_items';

-- If it's a view, we need to drop it first before creating the table
-- (Be careful - this will remove the view, but we're replacing it with a proper table)
DROP VIEW IF EXISTS public.task_action_items;

-- Now create the actual table
CREATE TABLE public.task_action_items (
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

-- Now create the indexes (this should work since we have a real table)
CREATE INDEX idx_task_action_items_task_id ON public.task_action_items(task_id);
CREATE INDEX idx_task_action_items_assigned_to_id ON public.task_action_items(assigned_to_id);
CREATE INDEX idx_task_action_items_organization_id ON public.task_action_items(organization_id);
CREATE INDEX idx_task_action_items_status ON public.task_action_items(status);
CREATE INDEX idx_task_action_items_due_date ON public.task_action_items(due_date);
CREATE INDEX idx_task_action_items_created_at ON public.task_action_items(created_at);

-- Add comments
COMMENT ON TABLE public.task_action_items IS 'Action items for tasks (similar to meeting minutes but for tasks)';
COMMENT ON COLUMN public.task_action_items.task_id IS 'References tasks.id - the parent task';
COMMENT ON COLUMN public.task_action_items.assigned_to_id IS 'References users.id - who is responsible';
COMMENT ON COLUMN public.task_action_items.serial_no IS 'Sequential number within the task for ordering';

-- Create the trigger function and trigger
CREATE OR REPLACE FUNCTION update_task_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER task_action_items_updated_at_trigger
    BEFORE UPDATE ON public.task_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_task_action_items_updated_at();

-- Verify everything worked
SELECT 
    table_name,
    table_type,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'task_action_items') as column_count,
    (SELECT count(*) FROM information_schema.table_constraints WHERE table_name = 'task_action_items' AND constraint_type = 'FOREIGN KEY') as foreign_key_count,
    (SELECT count(*) FROM pg_indexes WHERE tablename = 'task_action_items') as index_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'task_action_items';

-- Success message
SELECT 'Step 3 FIXED: task_action_items table created successfully (replaced view with table)' as status;