-- Allow Tenants to view profiles of users who have connected with them.
-- This is necessary for the Customer List to show names/emails of connected users.

CREATE POLICY "Tenants can view connected profiles"
    ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.tenant_connections tc
            WHERE tc.user_id = public.profiles.id
            AND tc.status = 'accepted'
            AND tc.tenant_id IN (
                SELECT tenant_id 
                FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );
