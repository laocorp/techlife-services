-- Force Fix for Profile Updates
-- 1. Ensure phone column exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Drop existing update policy to avoid conflicts
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Re-create the policy correctly
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 4. Grant permissions explicitly (just in case)
GRANT UPDATE ON TABLE public.profiles TO authenticated;
