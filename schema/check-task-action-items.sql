-- Check if task_action_items table exists and its structure

-- Check table existence
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'task_action_items';

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'task_action_items'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'task_action_items';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'task_action_items';

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'task_action_items';

SELECT 'Table analysis complete!' as status;