-- COMPREHENSIVE RESET OF PROFILE POLICIES
-- This script drops all existing policies and re-creates them to ensure everything is correct.

-- 1. Drop EVERYTHING related to profiles (to avoid "already exists" errors)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles; -- Cleanup standard ones too if needed

-- 2. Create INSERT Policy (Allows creating your profile)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK ( auth.uid() = id );

-- 3. Create UPDATE Policy (Allows editing your profile)
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 4. Create SELECT Policy (Allows viewing your profile)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING ( auth.uid() = id );

-- 5. Grant necessary permissions
GRANT ALL ON TABLE public.profiles TO authenticated;
