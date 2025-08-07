-- Task Manager Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert departments from CSV data
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

-- Insert task data from CSV (MoM - 28.7.2025.csv)
DO $$
DECLARE
    admin_dept_id UUID;
    ixi_dept_id UUID;
    igpa_dept_id UUID;
    aadhynta_dept_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO admin_dept_id FROM departments WHERE name = 'Admin';
    SELECT id INTO ixi_dept_id FROM departments WHERE name = 'IXI';
    SELECT id INTO igpa_dept_id FROM departments WHERE name = 'IGPA';
    SELECT id INTO aadhynta_dept_id FROM departments WHERE name = 'Aadhynta Advisory';

    -- Insert tasks from CSV data
    INSERT INTO tasks (
        title, 
        description, 
        department_id, 
        assigned_to, 
        status, 
        rag_status, 
        bottlenecks, 
        rag_takeaway,
        due_date,
        priority,
        created_by_name
    ) VALUES
    -- Action Items
    (
        'Leave management system/TADS',
        'Ongoing development of leave management and travel allowance system',
        admin_dept_id,
        ARRAY['Pramish Sihali'],
        'In Progress'::task_status,
        'Unrated'::rag_status,
        NULL,
        NULL,
        NULL,
        'High'::task_priority,
        'System Import'
    ),

    -- Invest and Infra Projects (IXI)
    (
        'TAF BDS Year 2',
        'The status on MOU will be finalized today. We are working on hiring coordinator for Koshi this week and plan our work ahead for same.',
        ixi_dept_id,
        ARRAY['Poonam Regmi', 'Ishika Agrawal', 'Aryan Dhungana'],
        'In Progress'::task_status,
        'Amber'::rag_status,
        NULL,
        NULL,
        NULL,
        'High'::task_priority,
        'System Import'
    ),
    (
        'BAIN',
        'Application is closed and list of applicants is sent to Chudamani Bhattarai, Director General of CIM. This week the selection of candidate will be finalized. Next week Saujanya Timilsina and Ishika Agrawal will travel to Biratnagar for the session.',
        ixi_dept_id,
        ARRAY['Saujanya Timilsina', 'Ishika Agrawal'],
        'In Progress'::task_status,
        'Unrated'::rag_status,
        NULL,
        NULL,
        NULL,
        'Medium'::task_priority,
        'System Import'  
    ),
    (
        'Dish Home',
        'Had board meeting, readying for deployment',
        ixi_dept_id,
        ARRAY['Prasanna Pokhrel'],
        'In Progress'::task_status,
        'Green'::rag_status,
        'Slight delay due to Dish home management, financial closure and preparation for board meeting',
        NULL,
        NULL,
        'Medium'::task_priority,
        'System Import'
    ),
    (
        'UNDP DRRM',
        'Report has been finalized and the tax invoice to be shared',
        ixi_dept_id,
        ARRAY['Team Member'],
        'Completed'::task_status,
        'Amber'::rag_status,
        'Many external people',
        NULL,
        NULL,
        'Medium'::task_priority,
        'System Import'
    ),

    -- IGPA Projects
    (
        'ILO Sectoral diagnostic of Informality in construction sector',
        'Deliverables completed',
        igpa_dept_id,
        ARRAY['Bikram Acharya'],
        'Completed'::task_status,
        'Red'::rag_status,
        'Awaiting Reimbursement, delayed reimbursement',
        NULL,
        NULL,
        'High'::task_priority,
        'System Import'
    ),
    (
        'MERCY Corp. Political Economy Analysis of Weather forecasting in Nepal',
        'Inception report submitted on July 10, 2025 received feedback, incorporated the comments and forwarded the updated report on July 19th to Mercy Corps. Awaiting response on the updated inception report. Field visits (KIIs, FGDs) deadline on July 31, 2025.',
        igpa_dept_id,
        ARRAY['Ashika Kadariya', 'Sheran Singh Lama', 'Bikram Acharya'],
        'In Progress'::task_status,
        'Amber'::rag_status,
        NULL,
        NULL,
        '2025-08-31'::DATE,
        'High'::task_priority,
        'System Import'
    ),
    (
        'TAF: PEA Child Trafficking',
        'Contract will be signed today',
        igpa_dept_id,
        ARRAY['Manashwee Kafley'],
        'In Progress'::task_status,
        'Amber'::rag_status,
        NULL,
        NULL,
        NULL,
        'High'::task_priority,
        'System Import'
    ),

    -- Aadhynta Advisory Projects
    (
        'Website Development',
        'Website first iteration completed and live. Minor changes remaining will start working on the second phase.',
        aadhynta_dept_id,
        ARRAY['Shirish', 'Pramish', 'Prasiddha'],
        'In Progress'::task_status,
        'Amber'::rag_status,
        NULL,
        NULL,
        NULL,
        'Medium'::task_priority,
        'System Import'
    ),
    (
        'GBIME Project',
        'Gantt chart for the phase has been shared to the GBIME team and waiting for their response. This week priority is to sign MOU, decide who will be in the steering and execution committee, roll out of survey form to the SMEs.',
        aadhynta_dept_id,
        ARRAY['Team Member'],
        'In Progress'::task_status,
        'Green'::rag_status,
        NULL,
        NULL,
        NULL,
        'Medium'::task_priority,
        'System Import'
    );

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_department_id_idx ON tasks(department_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at);
CREATE INDEX IF NOT EXISTS task_updates_task_id_idx ON task_updates(task_id);
CREATE INDEX IF NOT EXISTS task_updates_created_at_idx ON task_updates(created_at);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view task updates" ON task_updates;
DROP POLICY IF EXISTS "Users can create task updates" ON task_updates;
DROP POLICY IF EXISTS "Users can view departments" ON departments;

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

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT ON task_updates TO authenticated;
GRANT SELECT ON departments TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

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

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Task Manager database setup completed successfully!';
  RAISE NOTICE 'Departments created: IGPA, IXI, Janaki Energy, Aadhynta Advisory, Admin';
  RAISE NOTICE 'Tasks imported from CSV data with proper department assignments';
  RAISE NOTICE 'All users can view tasks, create new tasks, and add updates/remarks';
END $$;