-- Multi-Tenant Database Migration V2
-- Simple passwords and proper organization separation

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

-- Step 2: Insert Organizations with proper names
INSERT INTO public.organizations (name, slug, domain) VALUES 
('InvestInfra', 'investinfra', 'investinfra.com'),
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

-- Step 4: Update existing data to belong to InvestInfra organization
DO $$
DECLARE
    investinfra_org_id uuid;
BEGIN
    SELECT id INTO investinfra_org_id FROM public.organizations WHERE slug = 'investinfra';
    
    -- Update all existing records to belong to InvestInfra organization
    UPDATE public.users SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.travel_requests SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.valley_requests SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.travel_group_members SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.expense_items SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.valley_expenses SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.receipts SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.tasks SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.task_updates SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.time_logs SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.time_log_comments SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.departments SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.projects SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.budgets SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.attendance SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.attendance_summary SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.leave_requests SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.events SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.event_attendees SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.halls SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
    UPDATE public.notifications SET organization_id = investinfra_org_id WHERE organization_id IS NULL;
END $$;

-- Step 5: Create Aadhyanta Fund Management users with simple passwords
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
    
    -- Insert Aadhyanta users with simple password "password123"
    -- Password hash for "password123": $2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.
    INSERT INTO public.users (email, password, name, role, organization_id, department, designation, created_at, updated_at) VALUES
    ('amit.koirala@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Amit Koirala', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('santosh.thapa@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Santosh Thapa', 'approver', aadhyanta_org_id, 'General', 'Manager', now(), now()),
    ('pramesh.pradhan@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Pramesh Man Pradhan', 'approver', aadhyanta_org_id, 'General', 'Manager', now(), now()),
    ('aashma.mainali@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Aashma Mainali', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('nischal.bhandari@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Nischal Singh Bhandari', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('bijesh.rajkarnikar@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Bijesh Rajkarnikar', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('sumit.bhattarai@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Sumit Bhattarai', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('asmita.waiba@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Asmita Waiba', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('bimala.waiba@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Bimala Waiba', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('manoj.waiba@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Manoj Waiba', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('supragya.rijal@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Supragya Rijal', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('elina.tamang@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Elina Lama Tamang', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now()),
    ('arya.subedi@aadhyanta.com', '$2b$10$rOiO4k5/MZwFLf0HvjW.L.Ql1.QGzjq8AvqJ4k5/MZwFLf0HvjW.L.', 'Arya Subedi', 'employee', aadhyanta_org_id, 'General', 'Staff', now(), now())
    ON CONFLICT (email) DO NOTHING;
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_organization_id ON public.travel_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);

-- Step 7: Create a view for easy organization lookup
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

-- Step 8: Create organization-specific approver views
CREATE OR REPLACE VIEW organization_approvers AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.department,
    u.designation,
    u.organization_id,
    o.name as organization_name,
    o.slug as organization_slug
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.role IN ('approver', 'admin') AND o.is_active = true;

-- Step 9: Create organization-specific employee views
CREATE OR REPLACE VIEW organization_employees AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.department,
    u.designation,
    u.organization_id,
    o.name as organization_name,
    o.slug as organization_slug
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.role = 'employee' AND o.is_active = true;

-- Summary of changes
SELECT 
    'Migration V2 completed successfully!' as status,
    COUNT(*) as total_organizations
FROM organizations;

SELECT 
    o.name as organization,
    COUNT(u.id) as user_count,
    COUNT(CASE WHEN u.role = 'approver' THEN 1 END) as approver_count,
    COUNT(CASE WHEN u.role = 'employee' THEN 1 END) as employee_count,
    COUNT(CASE WHEN u.role = 'admin' THEN 1 END) as admin_count
FROM organizations o
LEFT JOIN users u ON o.id = u.organization_id
GROUP BY o.id, o.name
ORDER BY o.name;