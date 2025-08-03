-- Supabase Attendance Management Tables

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'leave')) NOT NULL,
  leave_type TEXT CHECK (leave_type IN ('sick', 'personal', 'vacation', 'emergency', 'other')),
  leave_reason TEXT,
  approver TEXT,
  is_advanced_leave BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, date)
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  leave_type TEXT CHECK (leave_type IN ('sick', 'personal', 'vacation', 'emergency', 'other')) NOT NULL,
  reason TEXT NOT NULL,
  approver_id TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_advanced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_summary table for reporting
CREATE TABLE IF NOT EXISTS attendance_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  present_days INTEGER DEFAULT 0,
  leave_days INTEGER DEFAULT 0,
  total_working_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, month, year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_approver_id ON leave_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON leave_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_attendance_summary_employee_id ON attendance_summary(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_month_year ON attendance_summary(month, year);

-- Create update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_summary_updated_at BEFORE UPDATE ON attendance_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();