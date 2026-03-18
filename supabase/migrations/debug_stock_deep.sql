-- Deep Debug: Check Product, Movements, and Trigger Definition
-- 1. Check the specific product
SELECT id, name, quantity, updated_at FROM public.products WHERE name ILIKE '%Taladro%';

-- 2. Check recent movements for this product
SELECT 
    m.id, 
    m.created_at, 
    m.type, 
    m.quantity, 
    p.name as product_name
FROM public.inventory_movements m
JOIN public.products p ON m.product_id = p.id
WHERE p.name ILIKE '%Taladro%'
ORDER BY m.created_at DESC
LIMIT 5;

-- 3. Check if the function exists and has SECURITY DEFINER
SELECT 
    routines.routine_name,
    routines.security_type
FROM information_schema.routines
WHERE routine_name = 'update_stock_from_movement';
