-- Allow Tenants to DELETE their own connections
-- This is required for the "Delete Customer" button to work on connected users.

CREATE POLICY "Tenants can delete their own connections"
ON public.tenant_connections
FOR DELETE
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Ensure Tenants can DELETE local customers too (if not already existing)
-- Check if policy exists or create it safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Tenants can delete their own customers'
    ) THEN
        CREATE POLICY "Tenants can delete their own customers"
        ON public.customers
        FOR DELETE
        USING (
            tenant_id IN (
                SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            )
        );
    END IF;
END
$$;
