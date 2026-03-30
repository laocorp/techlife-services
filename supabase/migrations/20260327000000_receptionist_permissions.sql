-- GRANT RECEPTIONIST ACCESS TO PAYMENTS AND INVENTORY
-- 1. SERVICE ORDERS: Allow Update (for Confirm/Cancel/Status changes)
DROP POLICY IF EXISTS "Enable update for tenant staff with roles" ON public.service_orders;

CREATE POLICY "Enable update for tenant staff with roles"
ON public.service_orders
FOR UPDATE
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager', 'cashier', 'head_technician', 'receptionist')
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager', 'cashier', 'head_technician', 'receptionist')
    )
);

-- 2. INVENTORY MOVEMENTS: Allow Insert (for Stock Deduction & Restoration)
DROP POLICY IF EXISTS "Enable insert for tenant staff" ON public.inventory_movements;

CREATE POLICY "Enable insert for tenant staff"
ON public.inventory_movements
FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager', 'cashier', 'head_technician', 'sales_store', 'sales_field', 'receptionist')
    )
);

-- 3. PAYMENTS: Allow Insert/Update for Receptionist
-- Usually payments inherit tenant staff policies, let's ensure we have a broad policy for tenant staff
DROP POLICY IF EXISTS "Tenants can manage their own payments" ON public.payments;

CREATE POLICY "Tenants can manage their own payments"
ON public.payments
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid()
        AND role IN ('owner', 'manager', 'cashier', 'head_technician', 'receptionist')
    )
);

-- 4. PRODUCTS & CATEGORIES: Allow modification if needed (Though usually only admins modify catalog, 
-- but if reception needs to add products to inventory, they need insert/update on products)
DROP POLICY IF EXISTS "Tenants can manage their own products" ON public.products;
CREATE POLICY "Tenants can manage their own products"
ON public.products
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid()
        AND role IN ('owner', 'manager', 'head_technician', 'warehouse_keeper', 'receptionist')
    )
);

DROP POLICY IF EXISTS "Tenants can manage their own categories" ON public.product_categories;
CREATE POLICY "Tenants can manage their own categories"
ON public.product_categories
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid()
        AND role IN ('owner', 'manager', 'head_technician', 'warehouse_keeper', 'receptionist')
    )
);
