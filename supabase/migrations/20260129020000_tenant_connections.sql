-- Create tenant_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenant_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    initiated_by TEXT NOT NULL CHECK (initiated_by IN ('user', 'tenant')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tenant_connections ENABLE ROW LEVEL SECURITY;

-- Policies for Tenants (via tenant_id in JWT or profile check)
-- Simplest RLS assuming the user is authenticated and might be a tenant admin or a regular user.
-- For tenants: they need to see connections for their tenant_id.
-- Currently, we usually check `auth.uid()` against `profiles.tenant_id` OR `tenants.owner_id`.
-- Let's use a generic policy that allows access if you are the user OR if you belong to the tenant.

-- 1. Users can view/manage their own connections
CREATE POLICY "Users can view own connections"
    ON public.tenant_connections
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
    ON public.tenant_connections
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert connections (request to join)"
    ON public.tenant_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- 2. Tenants can view/manage connections to their tenant
-- This requires a complex check: Is auth.uid() a member of tenant_id?
-- We can use specific logic or a look-up.
-- Existing pattern for tenants usually relies on `tenants.id` being in a claim or lookup.
-- Let's stick to: "If I am the tenant owner or employee"
-- We'll assume a helper function `is_tenant_member(tenant_id)` exists or we do a subquery.
-- Subquery: exists(select 1 from profiles where id = auth.uid() and tenant_id = tenant_connections.tenant_id)

CREATE POLICY "Tenants can view their connections"
    ON public.tenant_connections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tenant_id = public.tenant_connections.tenant_id
        )
    );

CREATE POLICY "Tenants can insert connections (invite users)"
    ON public.tenant_connections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tenant_id = public.tenant_connections.tenant_id
        )
    );

CREATE POLICY "Tenants can update their connections"
    ON public.tenant_connections
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tenant_id = public.tenant_connections.tenant_id
        )
    );
