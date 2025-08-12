-- Add description field to meetings table for rich text content
-- This will store the formatted meeting description/agenda

ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS description text;

-- Add comment for documentation
COMMENT ON COLUMN public.meetings.description IS 'Rich text description or agenda for the meeting, formatted as bullet points';

-- Add index for better performance if needed for search
CREATE INDEX IF NOT EXISTS idx_meetings_description ON public.meetings USING GIN (to_tsvector('english', description));