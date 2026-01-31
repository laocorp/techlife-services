-- Enable Workshop access to Connected User Assets
-- This policy allows authenticated users (Workshop Staff) to VIEW assets belonging to users they are connected with.

CREATE POLICY "Workshops can view connected client assets"
ON public.user_assets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p -- The staff member (current user)
    JOIN tenant_connections tc ON tc.tenant_id = p.tenant_id -- The connection between Workshop and Client
    WHERE p.id = auth.uid() -- Filter for current user
    AND tc.user_id = user_assets.user_id -- Match the asset owner
    AND tc.status = 'accepted' -- Only if connection is accepted
  )
);
