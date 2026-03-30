-- DELETE TENANT SCRIPT (UPDATED with Cascade for Service AND Ecommerce Orders)
-- Target Tenant: Taller Test Env
-- ID: b662cd4f-c2c5-4ac0-97f3-82d6ecc5e979

DO $$
DECLARE
    target_tenant_id UUID := 'b662cd4f-c2c5-4ac0-97f3-82d6ecc5e979';
BEGIN
    -- 0.1 Delete Service Order Items (linked to Products and Service Orders)
    DELETE FROM service_order_items 
    WHERE service_order_id IN (SELECT id FROM service_orders WHERE tenant_id = target_tenant_id);

    -- 0.2 Delete Service Orders
    DELETE FROM service_orders WHERE tenant_id = target_tenant_id;

    -- 0.3 Delete Ecommerce Order Items (linked to Products and Ecommerce Orders)
    -- Assuming table name is 'ecommerce_orders'. If it's different, we might error, but the constraint name 'ecommerce_order_items...' suggests these tables exist.
    DELETE FROM ecommerce_order_items 
    WHERE order_id IN (SELECT id FROM ecommerce_orders WHERE tenant_id = target_tenant_id);

    -- 0.4 Delete Ecommerce Orders
    DELETE FROM ecommerce_orders WHERE tenant_id = target_tenant_id;

    -- 1. Delete Connections
    DELETE FROM tenant_connections WHERE tenant_id = target_tenant_id;
    
    -- 2. Delete Products 
    DELETE FROM products WHERE tenant_id = target_tenant_id;
    
    -- 3. Delete Customers (Local)
    DELETE FROM customers WHERE tenant_id = target_tenant_id;
    
    -- 4. Unlink Profiles (Staff)
    UPDATE profiles SET tenant_id = NULL WHERE tenant_id = target_tenant_id;
    
    -- 5. Delete the Tenant itself
    DELETE FROM tenants WHERE id = target_tenant_id;
    
    RAISE NOTICE 'Tenant and all related data (Service + Ecommerce) deleted successfully: %', target_tenant_id;
END $$;
