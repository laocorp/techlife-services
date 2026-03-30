-- =============================================
-- "NUCLEAR" FIX FOR SCHEMA ERROR & PERMISSIONS
-- =============================================

-- 1. Reload Schema Cache (Often the culprit for "error querying schema")
NOTIFY pgrst, 'reload schema';

-- 2. Ensure Extensions (pgcrypto needed for passwords)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Explicitly Grant Usage on Schema 'public'
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Grant Access to All Tables (Future-proof)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Fix Default Privileges for New Tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- 6. Verify RLS is not blocking SELECT by policy
-- Ensure Authenticated users can read valid profiles
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true); -- Allow reading ALL profiles for now to debug (we can tighten later)

-- 7. Reset User Password (Just in case hashing failed)
UPDATE auth.users
SET encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email IN ('bodega@test.com', 'recepcion@test.com', 'jefetaller@test.com');
