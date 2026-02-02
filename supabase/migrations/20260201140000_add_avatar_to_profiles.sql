-- Ensure profiles table has avatar_url
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ensure users can update their own avatar_url
-- (This should be covered by existing "update own profile" policy, but good to verify)
-- If policy allows "FULL" update, we are good.
