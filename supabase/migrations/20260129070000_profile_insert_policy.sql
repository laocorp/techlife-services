-- Enable INSERT for "Users can insert own profile"
-- This is needed if the profile row was never created.

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK ( auth.uid() = id );

-- Also ensure "Users can select own profile" exists
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING ( auth.uid() = id );
