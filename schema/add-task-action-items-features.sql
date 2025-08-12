-- Add remaining features to task_action_items table
-- Run this AFTER the simple creation script

-- Add comments
COMMENT ON TABLE public.task_action_items IS 'Action items for tasks';

-- Add remaining indexes
CREATE INDEX IF NOT EXISTS idx_task_action_items_assigned_to_id ON public.task_action_items(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_task_action_items_status ON public.task_action_items(status);
CREATE INDEX IF NOT EXISTS idx_task_action_items_due_date ON public.task_action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_task_action_items_created_at ON public.task_action_items(created_at);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_task_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger
CREATE TRIGGER task_action_items_updated_at_trigger
    BEFORE UPDATE ON public.task_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_task_action_items_updated_at();

-- Enable RLS
ALTER TABLE public.task_action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "task_action_items_select_policy" ON public.task_action_items
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "task_action_items_insert_policy" ON public.task_action_items
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "task_action_items_update_policy" ON public.task_action_items
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "task_action_items_delete_policy" ON public.task_action_items
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

SELECT 'Task action items features added successfully!' AS result;