-- STEP 4: Standardize UUID Generation Functions
-- Your database uses a mix of uuid_generate_v4() and gen_random_uuid()
-- This creates inconsistency - let's standardize everything to gen_random_uuid()

-- First, let's see which tables are using the old uuid_generate_v4()
SELECT 
    table_name, 
    column_name, 
    column_default
FROM information_schema.columns 
WHERE column_default LIKE '%uuid_generate_v4%'
ORDER BY table_name;

-- Update all tables to use gen_random_uuid() instead of uuid_generate_v4()
-- This ensures consistency across your entire database

-- budgets table
ALTER TABLE public.budgets ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- expense_items table  
ALTER TABLE public.expense_items ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- notifications table
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- projects table
ALTER TABLE public.projects ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- receipts table
ALTER TABLE public.receipts ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- travel_group_members table
ALTER TABLE public.travel_group_members ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- travel_requests table
ALTER TABLE public.travel_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- users table
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify all tables now use gen_random_uuid()
SELECT 
    table_name, 
    column_name, 
    column_default
FROM information_schema.columns 
WHERE column_name = 'id' 
AND column_default LIKE '%gen_random_uuid%'
ORDER BY table_name;

-- Check if any tables still use the old function
SELECT 
    table_name, 
    column_name, 
    column_default
FROM information_schema.columns 
WHERE column_default LIKE '%uuid_generate_v4%';

-- Success message
SELECT 'Step 4 Complete: All UUID generation standardized to gen_random_uuid()' as status;