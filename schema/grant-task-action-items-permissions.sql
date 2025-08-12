-- Grant necessary permissions for task_action_items table

-- Grant permissions to authenticated users
GRANT ALL ON public.task_action_items TO authenticated;
GRANT ALL ON public.task_action_items TO service_role;

-- Grant usage on the sequence if it exists
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure RLS is properly configured
ALTER TABLE public.task_action_items ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies with simpler names
DROP POLICY IF EXISTS "task_action_items_select_policy" ON public.task_action_items;
DROP POLICY IF EXISTS "task_action_items_insert_policy" ON public.task_action_items;
DROP POLICY IF EXISTS "task_action_items_update_policy" ON public.task_action_items;
DROP POLICY IF EXISTS "task_action_items_delete_policy" ON public.task_action_items;

-- Create simplified RLS policies
CREATE POLICY "Enable read access for organization members" ON public.task_action_items
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.task_action_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.task_action_items
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON public.task_action_items
    FOR DELETE USING (true);

-- Test the table with a simple query
SELECT COUNT(*) as table_test FROM public.task_action_items;

SELECT 'Permissions granted and RLS configured!' as status;