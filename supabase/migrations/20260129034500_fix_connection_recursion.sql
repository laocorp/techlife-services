-- Fix recursion in tenant_connections policies by using the secure helper
-- instead of querying profiles directly (which causes a cycle).

DROP POLICY IF EXISTS "Tenants can view their connections" ON public.tenant_connections;
DROP POLICY IF EXISTS "Tenants can insert connections (invite users)" ON public.tenant_connections; -- Original name
DROP POLICY IF EXISTS "Tenants can update their connections" ON public.tenant_connections;
DROP POLICY IF EXISTS "Tenants can insert connections" ON public.tenant_connections; -- Short name if used

-- Re-create using get_my_tenant_id()
-- Note: get_my_tenant_id() returns the tenant_id of the current user.

CREATE POLICY "Tenants can view their connections"
    ON public.tenant_connections
    FOR SELECT
    USING (
        tenant_id = public.get_my_tenant_id()
    );

CREATE POLICY "Tenants can insert connections"
    ON public.tenant_connections
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_my_tenant_id()
    );

CREATE POLICY "Tenants can update their connections"
    ON public.tenant_connections
    FOR UPDATE
    USING (
        tenant_id = public.get_my_tenant_id()
    );
