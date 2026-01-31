-- FIX: Lookup User by Email (Querying Auth System)
-- The previous version queried 'profiles.email', which might be empty.
-- This version queries 'auth.users' which is the source of truth for emails.

CREATE OR REPLACE FUNCTION public.lookup_user_by_email(search_email TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Security check
    IF auth.role() != 'authenticated' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        p.id, 
        p.full_name, 
        p.avatar_url
    FROM auth.users au
    JOIN public.profiles p ON p.id = au.id
    WHERE LOWER(au.email) = LOWER(search_email) -- Case insensitive search
    LIMIT 1;
END;
$$;
