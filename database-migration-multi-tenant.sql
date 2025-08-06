-- Multi-Tenant Database Migration
-- This adds organization support to the existing schema

-- Step 1: Create Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  slug character varying UNIQUE NOT NULL,
  domain character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

-- Step 2: Insert Organizations
INSERT INTO public.organizations (name, slug, domain) VALUES 
('Default Organization', 'default', 'default.com'),
('Aadhyanta Fund Management', 'aadhyanta', 'aadhyanta.com')
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Add organization_id to all existing tables
-- Users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Travel related tables
ALTER TABLE public.travel_requests ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.valley_requests ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.travel_group_members ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.expense_items ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.valley_expenses ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Task management tables
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.task_updates ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.time_log_comments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Project and budget tables
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Attendance tables
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.attendance_summary ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Event management tables
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.event_attendees ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.halls ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Notification table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Step 4: Update existing data to belong to default organization
DO $$
DECLARE
    default_org_id uuid;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'default';
    
    -- Update all existing records to belong to default organization
    UPDATE public.users SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.travel_requests SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.valley_requests SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.travel_group_members SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.expense_items SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.valley_expenses SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.receipts SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.tasks SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.task_updates SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.time_logs SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.time_log_comments SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.departments SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.projects SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.budgets SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.attendance SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.attendance_summary SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.leave_requests SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.events SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.event_attendees SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.halls SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.notifications SET organization_id = default_org_id WHERE organization_id IS NULL;
END $$;

-- Step 5: Create Aadhyanta Fund Management users
DO $$
DECLARE
    aadhyanta_org_id uuid;
    dept_id uuid;
BEGIN
    -- Get Aadhyanta organization ID
    SELECT id INTO aadhyanta_org_id FROM public.organizations WHERE slug = 'aadhyanta';
    
    -- Create default department for Aadhyanta
    INSERT INTO public.departments (name, description, organization_id, is_active) 
    VALUES ('General', 'General Department', aadhyanta_org_id, true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO dept_id;
    
    -- If department already exists, get its ID
    IF dept_id IS NULL THEN
        SELECT id INTO dept_id FROM public.departments 
        WHERE name = 'General' AND organization_id = aadhyanta_org_id;
    END IF;
    
    -- Insert Aadhyanta users (Pramesh and Santosh as approvers, rest as employees)
    INSERT INTO public.users (email, password, name, role, organization_id, department, designation, created_at, updated_at) VALUES
    ('amit.koirala@aadhyanta.com', '$2b$10$9L0xM8nO4qR2sT6uV7wX9fxy0zA3bC5dF6gH8iK9lM0nP1qR2s', 'Amit Koirala', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('santosh.thapa@aadhyanta.com', '$2b$10$0M1yN9oP5rS3tU7vW8xY0gz1yAB4bD6eG7hJ9kL0mN1oQ2rS3t', 'Santosh Thapa', 'approver', aadhyanta_org_id, 'General', 'Manager', now(), now()),
    ('pramesh.pradhan@aadhyanta.com', '$2b$10$1N2zO0pQ6sT4uV8wX9yZ1ha2zBC5cE7fH8iK0lM1nO2pR3sT4u', 'Pramesh Man Pradhan', 'approver', aadhyanta_org_id, 'General', 'Manager', now(), now()),
    ('aashma.mainali@aadhyanta.com', '$2b$10$2O3aP1qR7tU5vW9xY0zA2ib3aCB6dF8gI9jL1mN2oP3qS4tU5v', 'Aashma Mainali', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('nischal.bhandari@aadhyanta.com', '$2b$10$3P4bQ2rS8uV6wX0yZ1aB3jc4bDC7eG9hJ0kM2nO3pQ4rT5uV6w', 'Nischal Singh Bhandari', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('bijesh.rajkarnikar@aadhyanta.com', '$2b$10$4Q5cR3sT9vW7xY1zA2bC4kd5cED8fH0iK1lN3oP4qR5sU6vW7x', 'Bijesh Rajkarnikar', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('sumit.bhattarai@aadhyanta.com', '$2b$10$5R6dS4tU0wX8yZ2aB3cD5le6dFE9gI1jL2mO4pQ5rS6tV7wX8y', 'Sumit Bhattarai', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('asmita.waiba@aadhyanta.com', '$2b$10$6S7eT5uV1xY9zA3bC4dE6mf7eGF0hJ2kM3nP5qR6sT7uW8xY9z', 'Asmita Waiba', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('bimala.waiba@aadhyanta.com', '$2b$10$7T8fU6vW2yZ0aB4cD5eF7ng8fHG1iK3lN4oQ6rS7tU8vX9yZ0a', 'Bimala Waiba', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('manoj.waiba@aadhyanta.com', '$2b$10$8U9gV7wX3zA1bC5dE6fG8oh9gIH2jL4mO5pR7sT8uV9wY0zA1b', 'Manoj Waiba', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('supragya.rijal@aadhyanta.com', '$2b$10$9V0hW8xY4aB2cD6eF7gH9pi0hJI3kM5nP6qS8tU9vW0xZ1aB2c', 'Supragya Rijal', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('elina.tamang@aadhyanta.com', '$2b$10$0W1iX9yZ5bC3dE7fG8hI0qj1iKJ4lN6oQ7rT9uV0wX1yA2bC3d', 'Elina Lama Tamang', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('arya.subedi@aadhyanta.com', '$2b$10$1X2jY0zA6cD4eF8gH9iJ1rk2jLK5mO7pR8sU0vW1xY2zA3cD4e', 'Arya Subedi', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now())
    ON CONFLICT (email) DO NOTHING;
END $$;



-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_organization_id ON public.travel_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);

-- Step 8: Create a view for easy organization lookup
CREATE OR REPLACE VIEW user_organizations AS
SELECT 
    u.id as user_id,
    u.email,
    u.name as user_name,
    u.role,
    o.id as organization_id,
    o.name as organization_name,
    o.slug as organization_slug
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE o.is_active = true;

-- Summary of changes
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_organizations
FROM organizations;

SELECT 
    o.name as organization,
    COUNT(u.id) as user_count
FROM organizations o
LEFT JOIN users u ON o.id = u.organization_id
GROUP BY o.id, o.name
ORDER BY o.name;