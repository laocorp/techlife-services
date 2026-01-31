-- Allow Users to VIEW their own connections
-- This fixes the issue where the Portal showed "Not Linked" even if connected.

CREATE POLICY "Users can view their own connections"
ON public.tenant_connections
FOR SELECT
USING (
    user_id = auth.uid()
);
