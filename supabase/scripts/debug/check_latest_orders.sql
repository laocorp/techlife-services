-- Helper to check the latest sales orders
SELECT 
    id,
    sales_agent_id,
    COALESCE(sales_channel, 'store') as channel,
    status,
    total_amount,
    created_at
FROM public.ecommerce_orders
ORDER BY created_at DESC
LIMIT 5;

-- Also check stock changes for last modified products
-- SELECT id, name, quantity, updated_at FROM public.products ORDER BY updated_at DESC LIMIT 5;
