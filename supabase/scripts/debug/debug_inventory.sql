-- Inspect Product and Movements for 'Taladro'
-- Replace 'Taladro%' with a closer match if needed
SELECT 
    p.id, 
    p.name, 
    p.quantity, 
    p.type,
    p.tenant_id
FROM public.products p
WHERE p.name ILIKE '%Taladro%';

-- Check the last 5 movements for any Taladro
SELECT 
    m.id,
    m.product_id,
    m.type,
    m.quantity,
    m.created_at,
    p.name as product_name
FROM public.inventory_movements m
JOIN public.products p ON m.product_id = p.id
WHERE p.name ILIKE '%Taladro%'
ORDER BY m.created_at DESC
LIMIT 5;
