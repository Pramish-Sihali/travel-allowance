-- STEP 1: Fix Notifications Table Duplicate Fields
-- This fixes the immediate API confusion with the notifications table

-- Check current structure first
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('read', 'is_read');

-- Remove the duplicate 'read' field if it exists
ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;

-- Verify the fix worked
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('read', 'is_read');

-- Success message
SELECT 'Step 1 Complete: Notifications table duplicate field removed' as status;