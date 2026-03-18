-- Check existing users and their roles
SELECT id, email, role, first_name, last_name 
FROM public.profiles 
ORDER BY role;
