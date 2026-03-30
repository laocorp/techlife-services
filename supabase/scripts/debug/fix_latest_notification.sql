-- Manually update the latest notification to have the correct link format
-- This allows the user to test the "click" functionality without creating a new order/shipment.
UPDATE notifications
SET link = '/portal/dashboard?order_id=' || (
    -- Extract order ID from message if possible, or fallback to a known recent order ID if needed.
    -- Here we try to get the order ID from the "related" order of the user if we could join, 
    -- but for safety/simplicity, let's just update the ONE specific notification from the user's screenshot
    -- ID: 92f7b507-7a6a-48e0-bfe8-cf75f2c91f42
    -- And we need the order Id for it.
    -- Let's just set it to the order ID from their screenshot #7fba3fd9... which corresponds to UUID...
    -- Actually, it's safer to just ask the user to create a NEW action.
    -- But to "fix" the current one:
    
    -- We can try to subquery the order id if we assume the user only has one active order.
    -- OR, simpler: update ALL notifications for the user to point to a test order? No.
    
    -- Let's just update the specific row from the screenshot.
    -- We'll assume the order ID is the one they showed in previous screenshots: 7fba3fd9...
    -- Wait, I don't have the full UUID of the order "7fba3fd9".
    -- I'll have to subquery it.
    
    SELECT id FROM ecommerce_orders 
    WHERE id::text LIKE '7fba3fd9%' 
    LIMIT 1
)
WHERE id = '92f7b507-7a6a-48e0-bfe8-cf75f2c91f42';
