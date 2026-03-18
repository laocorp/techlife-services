-- Fix Role for Jhonatan Masias
-- The user was created as 'owner' by mistake. Change to 'sales_store'.

UPDATE public.profiles
SET role = 'sales_store'
WHERE id = '3c7cc474-9800-452b-a67c-10ad0336541c';

-- Verify the change
SELECT full_name, role, sales_code FROM public.profiles WHERE id = '3c7cc474-9800-452b-a67c-10ad0336541c';
