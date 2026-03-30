-- Debug: Check if product update is blocked by RLS or if trigger is disabled
-- 1. Check if trigger is enabled
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_orientation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inventory_movements'
AND trigger_name = 'tr_update_stock';

-- 2. Try to manually update the product quantity to see if RLS blocks it
-- Replace PRODUCT_ID with the ID from the previous query result (copy-paste it)
-- UPDATE public.products SET quantity = 10 WHERE id = 'YOUR_PRODUCT_ID_HERE';

-- 3. Check RLS policies on products table again
SELECT * FROM pg_policies WHERE tablename = 'products';
