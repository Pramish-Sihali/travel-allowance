-- Fix Organization Assignment
-- Move all users from "Default Organization" to "InvestInfra"

DO $$
DECLARE
    default_org_id uuid;
    investinfra_org_id uuid;
BEGIN
    -- Get organization IDs
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'default';
    SELECT id INTO investinfra_org_id FROM public.organizations WHERE slug = 'investinfra';
    
    -- If InvestInfra doesn't exist, create it
    IF investinfra_org_id IS NULL THEN
        INSERT INTO public.organizations (name, slug, domain, is_active) 
        VALUES ('InvestInfra', 'investinfra', 'investinfra.com', true)
        RETURNING id INTO investinfra_org_id;
    END IF;
    
    -- Update all users from default to investinfra
    UPDATE public.users 
    SET organization_id = investinfra_org_id 
    WHERE organization_id = default_org_id;
    
    -- Update all other tables from default to investinfra
    UPDATE public.travel_requests SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.valley_requests SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.travel_group_members SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.expense_items SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.valley_expenses SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.receipts SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.tasks SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.task_updates SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.time_logs SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.time_log_comments SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.departments SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.projects SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.budgets SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.attendance SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.attendance_summary SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.leave_requests SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.events SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.event_attendees SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.halls SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    UPDATE public.notifications SET organization_id = investinfra_org_id WHERE organization_id = default_org_id;
    
    -- Optional: Delete the default organization if no longer needed
    -- DELETE FROM public.organizations WHERE slug = 'default';
    
    RAISE NOTICE 'Successfully moved all data from Default Organization to InvestInfra';
END $$;

-- Verify the changes
SELECT 
    o.name as organization,
    o.slug,
    COUNT(u.id) as user_count,
    COUNT(CASE WHEN u.role = 'approver' THEN 1 END) as approver_count,
    COUNT(CASE WHEN u.role = 'employee' THEN 1 END) as employee_count,
    COUNT(CASE WHEN u.role = 'admin' THEN 1 END) as admin_count
FROM organizations o
LEFT JOIN users u ON o.id = u.organization_id
GROUP BY o.id, o.name, o.slug
ORDER BY o.name;

-- Show sample users to verify
SELECT 
    u.name,
    u.email,
    u.role,
    o.name as organization_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
ORDER BY o.name, u.name
LIMIT 10;