-- Secure RPC to fetch connected customers for a tenant
-- Bypasses RLS to ensure workshop always sees names of connected users.
-- UPDATED: Now includes 'phone' (after adding column to profiles).

DROP FUNCTION IF EXISTS public.get_tenant_connected_customers(UUID);

CREATE OR REPLACE FUNCTION public.get_tenant_connected_customers(p_tenant_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT 
        tc.user_id,
        coalesce(p.full_name, 'Sin Nombre'),
        p.phone, -- Now we select it!
        tc.created_at,
        tc.status
    FROM public.tenant_connections tc
    LEFT JOIN public.profiles p ON tc.user_id = p.id
    WHERE tc.tenant_id = p_tenant_id
    AND tc.status = 'accepted';
END;
$$;
