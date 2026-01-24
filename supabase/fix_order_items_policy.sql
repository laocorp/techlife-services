-- Allow customers to view items of their own orders
create policy "Portal: Customers can view own order items" on public.service_order_items
  for select using (
    exists (
      select 1 from public.service_orders so
      where so.id = service_order_items.service_order_id
      and (
          -- Option A: Direct customer link
          exists (
            select 1 from public.customers c
            where c.id = so.customer_id
            and c.user_id = auth.uid()
          )
          OR
          -- Option B: Asset link
          exists (
              select 1 from public.customer_assets ca
              join public.customers c on ca.customer_id = c.id
              where ca.id = so.asset_id
              and c.user_id = auth.uid()
          )
      )
    )
  );
