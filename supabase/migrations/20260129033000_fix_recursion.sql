-- 1. Create helper to get tenant_id without RLS recursion
-- SECURITY DEFINER allows this function to bypass RLS when reading profiles
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Drop the recursive policy if it exists
DROP POLICY IF EXISTS "Tenants can view connected profiles" ON public.profiles;

-- 3. Re-create policy using the helper
CREATE POLICY "Tenants can view connected profiles"
    ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.tenant_connections tc
            WHERE tc.user_id = public.profiles.id
            AND tc.status = 'accepted'
            AND tc.tenant_id = public.get_my_tenant_id() -- Use secure function
        )
    );
