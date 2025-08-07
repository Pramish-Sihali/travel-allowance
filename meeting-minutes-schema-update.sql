-- Meeting Minutes Schema Update
-- This migration adds missing fields to the meeting_minutes table to support the new Excel-like table format

-- Add new columns to meeting_minutes table to support the enhanced table format
ALTER TABLE public.meeting_minutes 
ADD COLUMN IF NOT EXISTS responsibility text,
ADD COLUMN IF NOT EXISTS serial_no integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS remarks text,
ADD COLUMN IF NOT EXISTS flags text,
ADD COLUMN IF NOT EXISTS is_done boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS toggled_by text,
ADD COLUMN IF NOT EXISTS toggled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS created_by_name text,
ADD COLUMN IF NOT EXISTS updated_by_name text;

-- Update existing records to use the new format
-- For existing records, move content to responsibility field if responsibility is empty
UPDATE public.meeting_minutes 
SET responsibility = content 
WHERE responsibility IS NULL OR responsibility = '';

-- Set serial_no based on minute_order for existing records
UPDATE public.meeting_minutes 
SET serial_no = minute_order 
WHERE serial_no = 1 AND minute_order > 1;

-- For existing completed items, set is_done to true and populate toggled fields
UPDATE public.meeting_minutes 
SET 
    is_done = true,
    toggled_by = completed_by_name,
    toggled_at = completed_at
WHERE completion_status = 'completed' AND is_done = false;

-- Add indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_serial_no ON public.meeting_minutes(serial_no);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_is_done ON public.meeting_minutes(is_done);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_toggled_by ON public.meeting_minutes(toggled_by);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_toggled_at ON public.meeting_minutes(toggled_at);

-- Update column comments for documentation
COMMENT ON COLUMN public.meeting_minutes.responsibility IS 'Main responsibility or action item description';
COMMENT ON COLUMN public.meeting_minutes.serial_no IS 'Serial number for ordering items in the table';
COMMENT ON COLUMN public.meeting_minutes.remarks IS 'Additional remarks or notes about the action item';
COMMENT ON COLUMN public.meeting_minutes.flags IS 'Comma-separated additional flags or labels';
COMMENT ON COLUMN public.meeting_minutes.is_done IS 'Boolean flag indicating if the task is completed';
COMMENT ON COLUMN public.meeting_minutes.toggled_by IS 'Name of user who last toggled the done status';
COMMENT ON COLUMN public.meeting_minutes.toggled_at IS 'Timestamp when the done status was last toggled';
COMMENT ON COLUMN public.meeting_minutes.created_by_name IS 'Name of user who created this minute';
COMMENT ON COLUMN public.meeting_minutes.updated_by_name IS 'Name of user who last updated this minute';

-- Optional: Create a view for backward compatibility with old format
CREATE OR REPLACE VIEW public.meeting_minutes_legacy AS
SELECT 
    id,
    meeting_id,
    COALESCE(responsibility, content) as content,
    minute_order,
    is_action_item,
    assigned_to,
    assigned_to_name,
    due_date,
    due_time,
    priority,
    CASE 
        WHEN is_done = true THEN 'completed'
        ELSE completion_status
    END as completion_status,
    completion_percentage,
    estimated_hours,
    actual_hours,
    COALESCE(remarks, deadline_notes) as deadline_notes,
    reminder_sent,
    reminder_date,
    COALESCE(toggled_at, completed_at) as completed_at,
    completed_by,
    COALESCE(toggled_by, completed_by_name) as completed_by_name,
    created_at,
    updated_at,
    organization_id
FROM public.meeting_minutes;

-- Add a comment to the view
COMMENT ON VIEW public.meeting_minutes_legacy IS 'Legacy view for backward compatibility with old meeting minutes format';