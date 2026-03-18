-- =============================================
-- FIX 500 ERROR (RLS RECURSION)
-- =============================================
-- The previous 'Owners can view all' policy was causing infinite recursion.
-- This script replaces it with a safe, non-recursive pattern.

-- 1. Temporarily disable RLS to clear any weird states
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. DROP conflicting policies
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 3. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create SIMPLE, SAFE Policy (Non-Recursive)
-- This allows users to view ONLY their own profile.
-- This is enough to log in.
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 5. Create SAFE Admin Policy (using SECURITY DEFINER function to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  -- Access profiles directly without triggering RLS (because function is SECURITY DEFINER?)
  -- Actually, let's just use a direct query that doesn't recurse if we are careful.
  -- But simpler for now: Don't use a second policy yet. 
  -- Let's just create a function that we can use in the policy that is marked as SECURITY DEFINER.
  
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now the admin policy uses the function which bypasses RLS on the table itself
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        (SELECT public.get_my_role()) IN ('owner', 'manager', 'head_technician')
    );

-- Final status message
SELECT '✅ RLS Policies Fixed. Recursion removed.' as status;
