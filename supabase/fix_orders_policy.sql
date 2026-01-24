-- FIX ORDERS PERMISSIONS (IMPROVED)
-- Drop previous narrow policy if it exists
drop policy if exists "Portal: Customers can view own orders" on public.service_orders;

-- ALLOW if the order belongs to a customer linked to the user
-- OR if the order is for an ASSET owned by a customer linked to the user
create policy "Portal: View orders for own assets" on public.service_orders
  for select using (
    -- Option A: Direct customer link
    exists (
      select 1 from public.customers
      where id = service_orders.customer_id
      and user_id = auth.uid()
    )
    OR
    -- Option B: Asset link (Robust fallback)
    exists (
        select 1 from public.customer_assets ca
        join public.customers c on ca.customer_id = c.id
        where ca.id = service_orders.asset_id
        and c.user_id = auth.uid()
    )
  );
