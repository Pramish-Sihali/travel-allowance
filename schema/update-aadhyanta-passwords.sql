-- Update Aadhyanta Fund Management user passwords to 'password123'

-- Update all Aadhyanta users to have password 'password123'
-- Note: In production, passwords should be properly hashed
UPDATE public.users 
SET password = 'password123', updated_at = now()
WHERE organization_id = (
    SELECT id FROM public.organizations WHERE slug = 'aadhyanta'
);

-- Verify the update
SELECT 
    u.name,
    u.email,
    u.role,
    u.password,
    o.name as organization
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE o.slug = 'aadhyanta'
ORDER BY u.name;