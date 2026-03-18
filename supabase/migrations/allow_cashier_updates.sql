
-- Allow Cashiers (and Managers) to UPDATE service_orders 
-- This is critical for:
-- 1. Confirming Payment (pending_payment -> delivered)
-- 2. Cancelling Orders (pending_payment -> cancelled)

-- Drop existing policy if it's too restrictive (e.g., only owner or created_by)
DROP POLICY IF EXISTS "Enable update for users based on tenant" ON public.service_orders;

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
