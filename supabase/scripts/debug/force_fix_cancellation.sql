
-- NUCLEAR OPTIONS FOR CANCELLATION
-- This script removes ALL potential conflicting policies and re-creates
-- a single, robust policy for Cashier/Manager updates on Orders.

-- 1. SERVICE ORDERS: CLEAN SLATE
DROP POLICY IF EXISTS "Enable update for users based on tenant" ON public.service_orders;
DROP POLICY IF EXISTS "Enable update for tenant staff with roles" ON public.service_orders;
DROP POLICY IF EXISTS "Service Orders Update Policy" ON public.service_orders;

-- 2. CREATE NEW ROBUST POLICY
-- Allow Update if user is staff of the same tenant
CREATE POLICY "Allow Staff Update Orders"
ON public.service_orders
FOR UPDATE
USING (
  (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) = tenant_id
)
WITH CHECK (
  (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) = tenant_id
);

-- 3. INVENTORY MOVEMENTS: CLEAN SLATE
DROP POLICY IF EXISTS "Enable insert for tenant staff" ON public.inventory_movements;
DROP POLICY IF EXISTS "Enable select for tenant staff" ON public.inventory_movements;

-- 4. CREATE NEW ROBUST INVENTORY POLICIES
CREATE POLICY "Allow Staff Insert Movements"
ON public.inventory_movements
FOR INSERT
WITH CHECK (
  (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) = tenant_id
);

CREATE POLICY "Allow Staff Select Movements"
ON public.inventory_movements
FOR SELECT
USING (
  (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) = tenant_id
);

-- 5. VERIFY STAFF ROLE (Optional Check in App, but good for DB integrity)
-- We rely on App Logic for Role Checks, DB Policy just ensures data isolation.
