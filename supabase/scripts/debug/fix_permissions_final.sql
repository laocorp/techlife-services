
-- COMPREHENSIVE PERMISSIONS FIX
-- This script grants necessary permissions to Cashier/Manager/Head Technician
-- for both Service Orders and Inventory Movements.

-- 1. SERVICE ORDERS: Allow Update (for Confirm/Cancel)
DROP POLICY IF EXISTS "Enable update for tenant staff with roles" ON public.service_orders;

CREATE POLICY "Enable update for tenant staff with roles"
ON public.service_orders
FOR UPDATE
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager', 'cashier', 'head_technician')
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager', 'cashier', 'head_technician')
    )
);

-- 2. INVENTORY MOVEMENTS: Allow Insert (for Stock Deduction & Restoration)
-- Check if policy exists, if not create it.
-- Better to drop and recreate to be sure.
DROP POLICY IF EXISTS "Enable insert for tenant staff" ON public.inventory_movements;

CREATE POLICY "Enable insert for tenant staff"
ON public.inventory_movements
FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager', 'cashier', 'head_technician', 'sales_store', 'sales_field')
    )
);

-- 3. INVENTORY MOVEMENTS: Allow Select (to view history)
DROP POLICY IF EXISTS "Enable select for tenant staff" ON public.inventory_movements;

CREATE POLICY "Enable select for tenant staff"
ON public.inventory_movements
FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid()
    )
);
