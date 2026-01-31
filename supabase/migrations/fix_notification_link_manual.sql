UPDATE notifications
SET link = '/portal/dashboard?order_id=' || (
    SELECT id FROM ecommerce_orders WHERE id::text LIKE '7fba3fd9%' LIMIT 1
)
WHERE id = '92f7b507-7a6a-48e0-bfe8-cf75f2c91f42';
