-- Secure RPC to fetch connected customers for a tenant
-- Bypasses RLS to ensure workshop always sees names of connected users.
-- UPDATED: Includes DROP to allow signature change.

DROP FUNCTION IF EXISTS public.get_tenant_connected_customers(UUID);

CREATE OR REPLACE FUNCTION public.get_tenant_connected_customers(p_tenant_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    created_at TIMESTAMPTZ,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the executor is a member of the requested tenant
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND tenant_id = p_tenant_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not belong to this tenant.';
    END IF;

    RETURN QUERY
    SELECT 
        tc.user_id,
        coalesce(p.full_name, 'Sin Nombre'),
        tc.created_at,
        tc.status
    FROM public.tenant_connections tc
    LEFT JOIN public.profiles p ON tc.user_id = p.id
    WHERE tc.tenant_id = p_tenant_id
    AND tc.status = 'accepted';
END;
$$;
