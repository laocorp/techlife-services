-- Secure function to lookup user by email
-- Returns: id, full_name, avatar_url if found.
-- Security: SECURITY DEFINER needed to bypass RLS on profiles (since we are searching global users).
-- But we must restrict WHO can call it. Only authenticated users.

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
    -- Only allow if user is authenticated
    IF auth.role() != 'authenticated' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT p.id, p.full_name, p.avatar_url
    FROM public.profiles p
    WHERE p.email = search_email
    LIMIT 1;
END;
$$;
