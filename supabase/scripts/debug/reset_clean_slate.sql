-- =============================================
-- SYSTEM RESET & CLEAN SLATE
-- =============================================
-- This script WIPES all operational data to start fresh.
-- WARNING: This cannot be undone.

BEGIN;

-- 1. Truncate Tables (Order matters for FK, but CASCADE handles most)
-- Orders & Sales
TRUNCATE TABLE public.service_order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.service_orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.ecommerce_order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.ecommerce_orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.invoices RESTART IDENTITY CASCADE;

-- Inventory & Products
TRUNCATE TABLE public.inventory_movements RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.inventory_stock RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.products RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.categories RESTART IDENTITY CASCADE;

-- Assets & Logs
TRUNCATE TABLE public.personal_maintenance_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_assets RESTART IDENTITY CASCADE;

-- System & Audit
TRUNCATE TABLE public.audit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.notifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.webhooks RESTART IDENTITY CASCADE;

-- Core Organization (Leaf nodes first)
TRUNCATE TABLE public.tenant_connections RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.branches RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.warehouses RESTART IDENTITY CASCADE;

-- Profiles & Tenants (Root nodes)
-- Note: 'profiles' links to auth.users, so we delete here but auth.users persists unless deleted via API/Dashboard.
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.tenants RESTART IDENTITY CASCADE;

-- 2. Optional: Clean Authentication Users (Requires specific permissions)
-- This part is commented out because running it directly in SQL Editor might fail depending on your role.
-- It's SAFER to delete users manually from the Authentication Dashboard.
/*
DELETE FROM auth.users WHERE email IN (
    'bodega@test.com', 
    'recepcion@test.com', 
    'jefetaller@test.com',
    'tecnico@test.com',
    'vendedor@test.com',
    'cajero@test.com'
);
*/

COMMIT;
