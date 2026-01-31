-- Allow users to update their own profile
-- This policy is required for the Profile Settings page to work.

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- Also ensure specific columns are updatable if needed (Supabase usually handles this at table level)
-- Grant update on specific columns is not standard SQL RLS, but the policy covers the row.
