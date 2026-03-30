-- Check profiles by name (since email column doesn't participate in profiles)
SELECT id, first_name, last_name, role, tenant_id, created_at
FROM public.profiles
WHERE first_name ILIKE '%marlene%' OR last_name ILIKE '%marlene%';

-- Also check for 'cajero@test.com' user ID if it was created
SELECT id, email, role AS auth_role
FROM auth.users
WHERE email ILIKE '%caja%' OR email ILIKE '%marlene%';
