-- Check if Trigger exists and is enabled
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_orientation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inventory_movements';

-- Force a manual update to see if the table accepts writes
UPDATE public.products 
SET quantity = 5 
WHERE name ILIKE '%Taladro%'
RETURNING id, name, quantity;
