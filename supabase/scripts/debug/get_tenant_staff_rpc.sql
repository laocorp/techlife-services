-- Secure function to get staff IDs for a tenant
-- Used by authenticated users (e.g. Clients) to notify Workshop Staff
CREATE OR REPLACE FUNCTION public.get_tenant_staff_ids(p_tenant_id uuid)
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id
  FROM public.profiles
  WHERE tenant_id = p_tenant_id
  -- Optionally filter by role if you have roles, e.g. AND role IN ('owner', 'admin', 'technician')
  -- For now, notify everyone in the tenant
  ;
END;
$$;
