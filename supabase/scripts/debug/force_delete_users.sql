-- =============================================
-- FORCE DELETE AUTH USERS
-- =============================================
-- This script deletes users directly from auth.users.
-- Use this if the Supabase UI is failing.

-- Delete specific test users
DELETE FROM auth.users 
WHERE email IN (
    'bodega@test.com', 
    'recepcion@test.com', 
    'jefetaller@test.com',
    'tecnico@test.com',
    'vendedor@test.com',
    'cajero@test.com'
);

-- OPTIONAL: Delete ALL users (Uncomment if you want to wipe everything)
-- DELETE FROM auth.users WHERE email LIKE '%@test.com';
