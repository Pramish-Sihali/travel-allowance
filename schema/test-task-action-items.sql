-- Test task_action_items table functionality

-- Test 1: Simple select to verify table exists and is accessible
SELECT 'Test 1: Table access' as test;
SELECT COUNT(*) as record_count FROM public.task_action_items;

-- Test 2: Insert a test record
SELECT 'Test 2: Insert test record' as test;
INSERT INTO public.task_action_items (
    task_id,
    organization_id,
    serial_no,
    title,
    description,
    assigned_to_id,
    assigned_to_name,
    priority,
    status,
    created_by
) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    1,
    'Test Action Item',
    'This is a test description',
    gen_random_uuid(),
    'Test User',
    'Medium',
    'Not Started',
    'Test Creator'
);

-- Test 3: Select the inserted record
SELECT 'Test 3: Select inserted record' as test;
SELECT id, title, status FROM public.task_action_items WHERE title = 'Test Action Item';

-- Test 4: Update the test record
SELECT 'Test 4: Update test record' as test;
UPDATE public.task_action_items 
SET status = 'In Progress' 
WHERE title = 'Test Action Item';

-- Test 5: Delete the test record
SELECT 'Test 5: Delete test record' as test;
DELETE FROM public.task_action_items WHERE title = 'Test Action Item';

-- Final count
SELECT 'Final test: Record count after cleanup' as test;
SELECT COUNT(*) as final_count FROM public.task_action_items;

SELECT 'All tests completed successfully!' as status;