-- Simple Password Update for Aadhyanta Users Only
-- This script only updates passwords, nothing else

-- Update all Aadhyanta users to have password 'password123'
UPDATE public.users 
SET 
    password = 'password123',
    updated_at = now()
WHERE organization_id IN (
    SELECT id FROM public.organizations WHERE slug = 'aadhyanta'
);

-- Show confirmation
SELECT 
    COUNT(*) as users_updated,
    'Password updated to: password123' as message
FROM public.users u
JOIN public.organizations o ON u.organization_id = o.id
WHERE o.slug = 'aadhyanta';

-- Show all Aadhyanta users for verification
SELECT 
    u.name,
    u.email,
    u.role,
    'password123' as new_password,
    o.name as organization
FROM public.users u
JOIN public.organizations o ON u.organization_id = o.id
WHERE o.slug = 'aadhyanta'
ORDER BY u.role DESC, u.name;