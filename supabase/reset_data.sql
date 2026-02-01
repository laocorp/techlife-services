-- ⚠️ DANGER: THIS WILL DELETE ALL DATA FROM THE SYSTEM ⚠️
-- This script truncates all operational tables to reset the system state.
-- It keeps the structure (tables, triggers, RLS) intact.

TRUNCATE TABLE 
    inventory_movements,
    service_order_items,
    service_order_events,
    payments,
    service_orders,
    customer_assets,
    user_assets,
    ecommerce_order_items,
    ecommerce_orders,
    notifications,
    products,
    product_categories,  -- Corrected from 'categories'
    customers,
    tenants,
    profiles,
    personal_maintenance_logs
CASCADE;

COMMIT;
