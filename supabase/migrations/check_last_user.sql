-- Check the last created user's role to diagnose redirection issue
SELECT id, email, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;
