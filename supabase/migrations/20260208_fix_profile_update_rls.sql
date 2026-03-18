-- Fix infinite recursion in RLS policy by using a function
-- First, drop the problematic policy
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a helper function to check if user is owner/manager
CREATE OR REPLACE FUNCTION public.is_owner_or_manager(user_id uuid, target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id
        AND tenant_id = target_tenant_id
        AND role IN ('owner', 'manager')
    );
$$;

-- Create new policy using the helper function
CREATE POLICY "Users can update profiles"
ON profiles
FOR UPDATE
USING (
    -- User can update their own profile
    auth.uid() = id
    OR
    -- OR user is owner/manager in the same tenant
    public.is_owner_or_manager(auth.uid(), tenant_id)
)
WITH CHECK (
    -- Same conditions for the updated data
    auth.uid() = id
    OR
    public.is_owner_or_manager(auth.uid(), tenant_id)
);
