-- Add phone column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update RLS to allow users to update their own phone
-- Existing policies likely cover UPDATE based on id = auth.uid(), but checking just in case.
-- We assume "Users can update own profile" policy exists.
