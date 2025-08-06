-- Minutes of Meeting (MoM) Feature Database Migration
-- This creates all necessary tables for the MoM functionality with deadline assignment features

-- Create clients table for dummy client data
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  company character varying,
  email character varying,
  phone character varying,
  client_type character varying NOT NULL DEFAULT 'existing' CHECK (client_type IN ('new', 'existing')),
  contact_person character varying,
  address text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  task_id uuid,
  meeting_type character varying NOT NULL CHECK (meeting_type IN ('internal', 'external')),
  client_id uuid,
  location character varying NOT NULL,
  location_type character varying NOT NULL CHECK (location_type IN ('office', 'online', 'current_location')),
  latitude numeric,
  longitude numeric,
  location_address text,
  meeting_date date NOT NULL,
  meeting_time time without time zone,
  duration_minutes integer,
  created_by uuid NOT NULL,
  created_by_name character varying NOT NULL,
  assigned_to uuid,
  assigned_to_name character varying,
  deadline_date date,
  deadline_time time without time zone,
  priority character varying DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status character varying DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'overdue')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  CONSTRAINT meetings_pkey PRIMARY KEY (id),
  CONSTRAINT meetings_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT meetings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT meetings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT meetings_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT meetings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create meeting attendees table
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL,
  user_id uuid,
  attendee_name character varying NOT NULL,
  attendee_email character varying,
  attendee_organization character varying,
  attendee_type character varying NOT NULL CHECK (attendee_type IN ('internal', 'external')),
  attendance_status character varying DEFAULT 'invited' CHECK (attendance_status IN ('invited', 'attended', 'absent', 'declined')),
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  CONSTRAINT meeting_attendees_pkey PRIMARY KEY (id),
  CONSTRAINT meeting_attendees_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE,
  CONSTRAINT meeting_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT meeting_attendees_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create meeting minutes table with enhanced deadline assignment features
CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL,
  content text NOT NULL,
  minute_order integer NOT NULL DEFAULT 1,
  is_action_item boolean DEFAULT false,
  assigned_to uuid,
  assigned_to_name character varying,
  due_date date,
  due_time time without time zone,
  priority character varying DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  completion_status character varying DEFAULT 'pending' CHECK (completion_status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  estimated_hours numeric,
  actual_hours numeric,
  deadline_notes text,
  reminder_sent boolean DEFAULT false,
  reminder_date timestamp with time zone,
  completed_at timestamp with time zone,
  completed_by uuid,
  completed_by_name character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  CONSTRAINT meeting_minutes_pkey PRIMARY KEY (id),
  CONSTRAINT meeting_minutes_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE,
  CONSTRAINT meeting_minutes_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT meeting_minutes_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id),
  CONSTRAINT meeting_minutes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create meeting follow_ups table to track follow-up relationships
CREATE TABLE IF NOT EXISTS public.meeting_follow_ups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_meeting_id uuid NOT NULL,
  follow_up_meeting_id uuid NOT NULL,
  follow_up_type character varying DEFAULT 'general' CHECK (follow_up_type IN ('general', 'action_items', 'review', 'emergency')),
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  CONSTRAINT meeting_follow_ups_pkey PRIMARY KEY (id),
  CONSTRAINT meeting_follow_ups_parent_meeting_id_fkey FOREIGN KEY (parent_meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE,
  CONSTRAINT meeting_follow_ups_follow_up_meeting_id_fkey FOREIGN KEY (follow_up_meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE,
  CONSTRAINT meeting_follow_ups_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT meeting_follow_ups_unique UNIQUE (parent_meeting_id, follow_up_meeting_id)
);

-- Create meeting deadline assignments table for multiple assignees per meeting
CREATE TABLE IF NOT EXISTS public.meeting_deadline_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL,
  assigned_to uuid NOT NULL,
  assigned_to_name character varying NOT NULL,
  assigned_by uuid NOT NULL,
  assigned_by_name character varying NOT NULL,
  assignment_type character varying DEFAULT 'meeting' CHECK (assignment_type IN ('meeting', 'action_item', 'follow_up')),
  deadline_date date NOT NULL,
  deadline_time time without time zone,
  priority character varying DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  description text,
  completion_status character varying DEFAULT 'assigned' CHECK (completion_status IN ('assigned', 'accepted', 'in_progress', 'completed', 'rejected', 'overdue')),
  accepted_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  CONSTRAINT meeting_deadline_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT meeting_deadline_assignments_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE,
  CONSTRAINT meeting_deadline_assignments_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT meeting_deadline_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id),
  CONSTRAINT meeting_deadline_assignments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_task_id ON public.meetings(task_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_assigned_to ON public.meetings(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON public.meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_deadline_date ON public.meetings(deadline_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_priority ON public.meetings(priority);
CREATE INDEX IF NOT EXISTS idx_meetings_organization_id ON public.meetings(organization_id);

CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON public.meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON public.meeting_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_organization_id ON public.meeting_attendees(organization_id);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_id ON public.meeting_minutes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_assigned_to ON public.meeting_minutes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_completion_status ON public.meeting_minutes(completion_status);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_due_date ON public.meeting_minutes(due_date);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_priority ON public.meeting_minutes(priority);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_organization_id ON public.meeting_minutes(organization_id);

CREATE INDEX IF NOT EXISTS idx_meeting_follow_ups_parent_meeting_id ON public.meeting_follow_ups(parent_meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_follow_ups_organization_id ON public.meeting_follow_ups(organization_id);

CREATE INDEX IF NOT EXISTS idx_meeting_deadline_assignments_meeting_id ON public.meeting_deadline_assignments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_deadline_assignments_assigned_to ON public.meeting_deadline_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meeting_deadline_assignments_deadline_date ON public.meeting_deadline_assignments(deadline_date);
CREATE INDEX IF NOT EXISTS idx_meeting_deadline_assignments_completion_status ON public.meeting_deadline_assignments(completion_status);
CREATE INDEX IF NOT EXISTS idx_meeting_deadline_assignments_organization_id ON public.meeting_deadline_assignments(organization_id);

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON public.clients(client_type);

-- Insert dummy client data
INSERT INTO public.clients (name, company, email, phone, client_type, contact_person, address, notes, organization_id) VALUES
('Nepal Government', 'Ministry of Finance', 'contact@mof.gov.np', '+977-1-4211234', 'existing', 'Rajesh Sharma', 'Singha Durbar, Kathmandu', 'Government ministry client', NULL),
('World Bank', 'The World Bank Group', 'nepal@worldbank.org', '+977-1-5555000', 'existing', 'Sarah Johnson', 'UN Building, Pulchowk', 'International development partner', NULL),
('Asian Development Bank', 'ADB Nepal', 'adbnepal@adb.org', '+977-1-4200000', 'existing', 'Kumar Patel', 'ADB Building, Sanepa', 'Regional development bank', NULL),
('Local NGO Alliance', 'LNGO Alliance', 'info@lngoalliance.org.np', '+977-1-4300000', 'new', 'Maya Gurung', 'Thamel, Kathmandu', 'New local NGO partnership', NULL),
('Private Sector Corp', 'PSC Nepal', 'contact@pscnepal.com', '+977-1-4400000', 'new', 'Bikash Thapa', 'New Baneshwor, Kathmandu', 'Private sector engagement', NULL),
('Community Development Foundation', 'CDF Nepal', 'cdf@nepal.org', '+977-1-4500000', 'existing', 'Sita Rai', 'Lalitpur, Nepal', 'Community focused organization', NULL)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.meetings IS 'Stores meeting information with deadline assignment features';
COMMENT ON TABLE public.meeting_attendees IS 'Stores both internal users and external attendees for meetings';
COMMENT ON TABLE public.meeting_minutes IS 'Stores meeting minutes as bullet points with enhanced deadline tracking';
COMMENT ON TABLE public.meeting_follow_ups IS 'Tracks relationships between meetings and their follow-ups';
COMMENT ON TABLE public.meeting_deadline_assignments IS 'Tracks deadline assignments for meetings with multiple assignees';
COMMENT ON TABLE public.clients IS 'Stores client information for external meetings';

COMMENT ON COLUMN public.meetings.deadline_date IS 'Overall meeting deadline date';
COMMENT ON COLUMN public.meetings.deadline_time IS 'Overall meeting deadline time';
COMMENT ON COLUMN public.meetings.priority IS 'Meeting priority level for deadline management';
COMMENT ON COLUMN public.meetings.location_type IS 'Type of location: office, online, or current_location';
COMMENT ON COLUMN public.meetings.latitude IS 'GPS latitude for current_location type';
COMMENT ON COLUMN public.meetings.longitude IS 'GPS longitude for current_location type';
COMMENT ON COLUMN public.meeting_attendees.attendee_type IS 'internal for users from users table, external for manual entries';
COMMENT ON COLUMN public.meeting_minutes.is_action_item IS 'Whether this minute is an actionable item requiring follow-up';
COMMENT ON COLUMN public.meeting_minutes.completion_status IS 'Enhanced status tracking including in_progress';
COMMENT ON COLUMN public.meeting_minutes.completion_percentage IS 'Progress percentage for action items';
COMMENT ON COLUMN public.meeting_minutes.estimated_hours IS 'Estimated time to complete action item';
COMMENT ON COLUMN public.meeting_minutes.actual_hours IS 'Actual time taken to complete action item';
COMMENT ON COLUMN public.meeting_deadline_assignments.assignment_type IS 'Type of assignment: meeting, action_item, or follow_up';
COMMENT ON COLUMN public.meeting_deadline_assignments.completion_status IS 'Detailed assignment status tracking';