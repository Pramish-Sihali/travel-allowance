-- Company Calendar Events Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create halls/rooms table for booking management
CREATE TABLE IF NOT EXISTS halls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  capacity INTEGER,
  location VARCHAR(255),
  amenities TEXT[], -- Array of amenities like 'projector', 'whiteboard', 'audio_system'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default halls/rooms
INSERT INTO halls (name, capacity, location, amenities) VALUES
  ('Conference Room A', 20, 'Ground Floor', ARRAY['projector', 'whiteboard', 'audio_system']),
  ('Conference Room B', 15, 'Ground Floor', ARRAY['projector', 'whiteboard']),
  ('Main Hall', 100, 'First Floor', ARRAY['projector', 'audio_system', 'stage']),
  ('Meeting Room 1', 8, 'Second Floor', ARRAY['whiteboard', 'tv_screen']),
  ('Meeting Room 2', 10, 'Second Floor', ARRAY['whiteboard', 'tv_screen']),
  ('Board Room', 12, 'Third Floor', ARRAY['projector', 'audio_system', 'whiteboard']),
  ('Training Room', 30, 'First Floor', ARRAY['projector', 'whiteboard', 'audio_system'])
ON CONFLICT (name) DO NOTHING;

-- Create events table with enhanced schema
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TIME, -- For specific time events (e.g., "14:30")
  end_time TIME, -- For specific time events (e.g., "16:00")
  is_all_day BOOLEAN DEFAULT FALSE, -- Whether this is an all-day event
  event_type VARCHAR(50) NOT NULL DEFAULT 'general',
  location VARCHAR(255),
  hall_id UUID REFERENCES halls(id), -- For hall bookings
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name VARCHAR(255) NOT NULL,
  created_by_role VARCHAR(50) NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'yearly'
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approval_status VARCHAR(20) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_attendees table for tracking who's attending events
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'attending', -- 'attending', 'maybe', 'not_attending'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_start_date_idx ON events(start_date);
CREATE INDEX IF NOT EXISTS events_end_date_idx ON events(end_date);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS events_created_by_idx ON events(created_by);
CREATE INDEX IF NOT EXISTS events_approval_status_idx ON events(approval_status);
CREATE INDEX IF NOT EXISTS events_hall_id_idx ON events(hall_id);
CREATE INDEX IF NOT EXISTS event_attendees_event_id_idx ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS event_attendees_user_id_idx ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS halls_name_idx ON halls(name);
CREATE INDEX IF NOT EXISTS halls_is_active_idx ON halls(is_active);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Approvers can create events" ON events;
DROP POLICY IF EXISTS "Approvers can update events" ON events;
DROP POLICY IF EXISTS "Approvers can delete events" ON events;
DROP POLICY IF EXISTS "Users can view attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can manage their attendance" ON event_attendees;
DROP POLICY IF EXISTS "Users can view halls" ON halls;

-- Events table policies

-- Policy 1: All authenticated users can view approved events
CREATE POLICY "Users can view approved events" ON events
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    approval_status = 'approved'
  );

-- Policy 2: All authenticated users can create events (some may require approval)
CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = created_by
  );

-- Policy 3: Users can update their own events, approvers can update any event
CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      auth.uid() = created_by OR
      auth.uid() IN (
        SELECT id FROM users WHERE role IN ('approver', 'admin')
      )
    )
  );

-- Policy 4: Users can delete their own events, approvers can delete any event
CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      auth.uid() = created_by OR
      auth.uid() IN (
        SELECT id FROM users WHERE role IN ('approver', 'admin')
      )
    )
  );

-- Event attendees table policies

-- Policy 1: Users can view all attendee information
CREATE POLICY "Users can view attendees" ON event_attendees
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Users can manage their own attendance
CREATE POLICY "Users can manage their attendance" ON event_attendees
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id
  );

-- Policy 3: Event creators can manage attendees for their events
CREATE POLICY "Event creators can manage attendees" ON event_attendees
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample event categories/types (optional - for reference)
-- These are handled in the frontend, but this shows the available types:
/*
Event Types Available:
- 'company_meeting' (Company Meetings - Admin/Approver only)
- 'hall_booking' (Hall Bookings - All employees)
- 'potluck' (Potluck/Social Events - All employees) 
- 'training' (Training Sessions - Admin/Approver only)
- 'holiday' (Company Holidays - Admin/Approver only)
- 'deadline' (Important Deadlines - Admin/Approver only)
- 'announcement' (Company Announcements - Admin/Approver only)
- 'birthday' (Birthday Celebrations - All employees)
- 'team_outing' (Team Outings - All employees)
- 'workshop' (Workshops - All employees)
- 'general' (General Events - All employees)
*/

-- Halls table policies

-- Policy 1: All authenticated users can view active halls
CREATE POLICY "Users can view active halls" ON halls
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    is_active = true
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_attendees TO authenticated;
GRANT SELECT ON halls TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create a function to get events for a specific date range (optional helper)
CREATE OR REPLACE FUNCTION get_events_for_month(year_param INTEGER, month_param INTEGER)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  event_type VARCHAR,
  location VARCHAR,
  created_by_name VARCHAR,
  created_by_role VARCHAR,
  attendee_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.event_type,
    e.location,
    e.created_by_name,
    e.created_by_role,
    COALESCE(a.attendee_count, 0) as attendee_count
  FROM events e
  LEFT JOIN (
    SELECT 
      event_id, 
      COUNT(*) as attendee_count 
    FROM event_attendees 
    WHERE status = 'attending' 
    GROUP BY event_id
  ) a ON e.id = a.event_id
  WHERE 
    e.approval_status = 'approved' AND
    EXTRACT(YEAR FROM e.start_date) = year_param AND
    EXTRACT(MONTH FROM e.start_date) = month_param
  ORDER BY e.start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_events_for_month(INTEGER, INTEGER) TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Company Calendar Events database setup completed successfully!';
  RAISE NOTICE 'All employees can now create hall bookings, potlucks, and social events.';
  RAISE NOTICE 'Company meetings, holidays, and announcements require approver role.';
END $$;