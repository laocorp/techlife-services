-- Inspect the profiles table schema properly
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Also list first 5 users to see example data
SELECT * FROM public.profiles LIMIT 5;
