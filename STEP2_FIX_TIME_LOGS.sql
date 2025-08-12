-- STEP 2: Fix Time Logs Table Structure
-- This adds missing fields that your code expects but aren't in the database

-- First, let's see the current time_logs table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'time_logs'
ORDER BY ordinal_position;

-- Add missing fields that your code expects
-- These fields are referenced in your code but missing from the database schema

-- Add task_type field (your code expects this with specific enum values)
ALTER TABLE public.time_logs 
ADD COLUMN IF NOT EXISTS task_type character varying 
CHECK (task_type::text = ANY (ARRAY[
    'Desk Research'::character varying, 
    'Field Visit'::character varying, 
    'Report Writing'::character varying, 
    'Interview/Consultation Meetings'::character varying, 
    'Visuals and Designing'::character varying, 
    'Data Analysis/Interpretation'::character varying, 
    'Finance/Administrative Tasks'::character varying
]::text[]));

-- Add hours_spent field (your code expects this instead of start_time/end_time)
ALTER TABLE public.time_logs 
ADD COLUMN IF NOT EXISTS hours_spent numeric 
CHECK (hours_spent > 0::numeric AND hours_spent <= 24::numeric);

-- Add date field (your code expects a simple date field)
ALTER TABLE public.time_logs 
ADD COLUMN IF NOT EXISTS date date;

-- Add user_name field (your code expects this for display purposes)
ALTER TABLE public.time_logs 
ADD COLUMN IF NOT EXISTS user_name character varying;

-- Verify the new structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'time_logs'
AND column_name IN ('task_type', 'hours_spent', 'date', 'user_name')
ORDER BY column_name;

-- Success message
SELECT 'Step 2 Complete: Time logs table structure updated with missing fields' as status;