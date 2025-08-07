-- Complete Database Setup for Travel Allowance System
-- This script creates all necessary tables for the task management and time logging system
-- Run this in your Supabase SQL Editor

-- ===========================================
-- 1. TASK MANAGEMENT TABLES (if not exists)
-- ===========================================

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert departments if they don't exist
INSERT INTO departments (name, description) VALUES
  ('IGPA', 'Institute of Governance and Public Affairs'),
  ('IXI', 'Innovation and Implementation Division'),
  ('Janaki Energy', 'Energy and Infrastructure Projects'),
  ('Aadhynta Advisory', 'Advisory and Consulting Services'),
  ('Admin', 'Administrative and General Tasks')
ON CONFLICT (name) DO NOTHING;

-- Create task status enum type
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create priority enum type
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RAG status enum type
DO $$ BEGIN
    CREATE TYPE rag_status AS ENUM ('Red', 'Amber', 'Green', 'Unrated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  assigned_to TEXT[], -- Array of assigned person names
  assigned_user_ids UUID[], -- Array of user IDs (optional, for future user linking)
  status task_status DEFAULT 'Not Started',
  priority task_priority DEFAULT 'Medium',
  rag_status rag_status DEFAULT 'Unrated',
  due_date DATE,
  start_date DATE,
  completion_date DATE,
  bottlenecks TEXT,
  rag_takeaway TEXT,
  remarks TEXT,
  created_by UUID,
  created_by_name VARCHAR(255),
  created_by_id UUID, -- Additional field for approver tracking
  approved_by_id UUID, -- Field for approver information
  approved_by_name VARCHAR(255), -- Field for approver name
  approved_at TIMESTAMP WITH TIME ZONE, -- Field for approval timestamp
  last_updated_by UUID,
  last_updated_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_updates table for tracking changes and remarks
CREATE TABLE IF NOT EXISTS task_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  update_type VARCHAR(50) NOT NULL, -- 'status_change', 'assignment', 'remark', 'general_update'
  old_value TEXT,
  new_value TEXT,
  remarks TEXT,
  updated_by UUID,
  updated_by_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. TIME LOGGING TABLES
-- ===========================================

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) NOT NULL CHECK (task_type IN (
        'Desk Research',
        'Field Visit', 
        'Report Writing',
        'Interview/Consultation Meetings',
        'Visuals and Designing',
        'Data Analysis/Interpretation',
        'Finance/Administrative Tasks'
    )),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    hours_spent DECIMAL(4,2) NOT NULL CHECK (hours_spent > 0 AND hours_spent <= 24),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint to tasks table
    CONSTRAINT fk_time_logs_task_id FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create time_log_comments table for commenting on time logs
CREATE TABLE IF NOT EXISTS time_log_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    time_log_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint to time_logs table
    CONSTRAINT fk_time_log_comments_time_log_id FOREIGN KEY (time_log_id) REFERENCES time_logs(id) ON DELETE CASCADE
);

-- ===========================================
-- 3. INDEXES FOR PERFORMANCE
-- ===========================================

-- Task table indexes
CREATE INDEX IF NOT EXISTS tasks_department_id_idx ON tasks(department_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at);
CREATE INDEX IF NOT EXISTS task_updates_task_id_idx ON task_updates(task_id);
CREATE INDEX IF NOT EXISTS task_updates_created_at_idx ON task_updates(created_at);

-- Time logs table indexes
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);
CREATE INDEX IF NOT EXISTS idx_time_logs_created_at ON time_logs(created_at);

-- Time log comments table indexes
CREATE INDEX IF NOT EXISTS idx_time_log_comments_time_log_id ON time_log_comments(time_log_id);
CREATE INDEX IF NOT EXISTS idx_time_log_comments_user_id ON time_log_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_time_log_comments_created_at ON time_log_comments(created_at);

-- ===========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_log_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view task updates" ON task_updates;
DROP POLICY IF EXISTS "Users can create task updates" ON task_updates;
DROP POLICY IF EXISTS "Users can view departments" ON departments;
DROP POLICY IF EXISTS "All users can view time logs" ON time_logs;
DROP POLICY IF EXISTS "All users can insert time logs" ON time_logs;
DROP POLICY IF EXISTS "All users can update time logs" ON time_logs;
DROP POLICY IF EXISTS "All users can delete time logs" ON time_logs;
DROP POLICY IF EXISTS "All users can view time log comments" ON time_log_comments;
DROP POLICY IF EXISTS "All users can insert time log comments" ON time_log_comments;
DROP POLICY IF EXISTS "All users can update time log comments" ON time_log_comments;
DROP POLICY IF EXISTS "All users can delete time log comments" ON time_log_comments;

-- Task table policies
CREATE POLICY "Users can view all tasks" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tasks" ON tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- Task updates table policies
CREATE POLICY "Users can view task updates" ON task_updates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create task updates" ON task_updates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Departments table policies
CREATE POLICY "Users can view departments" ON departments
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Time logs table policies (allow all authenticated users)
CREATE POLICY "All users can view time logs" ON time_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All users can insert time logs" ON time_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All users can update time logs" ON time_logs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All users can delete time logs" ON time_logs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Time log comments table policies
CREATE POLICY "All users can view time log comments" ON time_log_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All users can insert time log comments" ON time_log_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All users can update time log comments" ON time_log_comments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All users can delete time log comments" ON time_log_comments
    FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- 5. TRIGGERS
-- ===========================================

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_logs_updated_at ON time_logs;
CREATE TRIGGER update_time_logs_updated_at
    BEFORE UPDATE ON time_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_log_comments_updated_at ON time_log_comments;
CREATE TRIGGER update_time_log_comments_updated_at
    BEFORE UPDATE ON time_log_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 6. GRANT PERMISSIONS
-- ===========================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT ON task_updates TO authenticated;
GRANT SELECT ON departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON time_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON time_log_comments TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- 7. UTILITY FUNCTIONS
-- ===========================================

-- Create function to get tasks by department
CREATE OR REPLACE FUNCTION get_tasks_by_department(dept_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  department_name VARCHAR,
  assigned_to TEXT[],
  status task_status,
  priority task_priority,
  rag_status rag_status,
  due_date DATE,
  bottlenecks TEXT,
  rag_takeaway TEXT,
  created_by_name VARCHAR,
  last_updated_by_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    d.name as department_name,
    t.assigned_to,
    t.status,
    t.priority,
    t.rag_status,
    t.due_date,
    t.bottlenecks,
    t.rag_takeaway,
    t.created_by_name,
    t.last_updated_by_name,
    t.created_at,
    t.updated_at
  FROM tasks t
  JOIN departments d ON t.department_id = d.id
  WHERE 
    (dept_filter IS NULL OR d.name ILIKE dept_filter)
    AND d.is_active = true
  ORDER BY 
    d.name, 
    CASE t.priority 
      WHEN 'Critical' THEN 1
      WHEN 'High' THEN 2
      WHEN 'Medium' THEN 3
      WHEN 'Low' THEN 4
    END,
    t.due_date ASC NULLS LAST,
    t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_tasks_by_department(TEXT) TO authenticated;

-- ===========================================
-- 8. SUCCESS MESSAGE & VERIFICATION
-- ===========================================

-- Final success message
DO $$ 
BEGIN 
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'COMPLETE DATABASE SETUP FINISHED!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '- departments (with sample data)';
  RAISE NOTICE '- tasks (with full task management)';
  RAISE NOTICE '- task_updates (for change tracking)';
  RAISE NOTICE '- time_logs (for time tracking)';
  RAISE NOTICE '- time_log_comments (for collaboration)';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables have:';
  RAISE NOTICE '- Row Level Security enabled';
  RAISE NOTICE '- Proper indexes for performance';
  RAISE NOTICE '- Foreign key constraints';
  RAISE NOTICE '- Triggers for updated_at timestamps';
  RAISE NOTICE '';
  RAISE NOTICE 'Time logging system ready with:';
  RAISE NOTICE '- 7 predefined task types';
  RAISE NOTICE '- Comment system for time logs';
  RAISE NOTICE '- Proper validation and constraints';
  RAISE NOTICE '===========================================';
END $$;