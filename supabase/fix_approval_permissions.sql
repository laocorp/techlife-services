-- Allow customers to UPDATE the status of their own orders (e.g. to 'repair' for approval)
create policy "Portal: Customers can update own orders" on public.service_orders
  for update
  using (
    exists (
      select 1 from public.customers c
      where c.id = service_orders.customer_id
      and c.user_id = auth.uid()
    )
    OR
    exists (
        select 1 from public.customer_assets ca
        join public.customers c on ca.customer_id = c.id
        where ca.id = service_orders.asset_id
        and c.user_id = auth.uid()
    )
  )
  with check (
     -- Only allow changing status, or ensure they don't change tenant_id etc.
     -- Ideally we check columns, but PG RLS 'with check' checks the new row.
     -- We trust the server action to only send status='repair', but for security:
     (status = 'repair' OR status = 'approval') 
  );

-- Allow customers to INSERT events (for the approval log)
create policy "Portal: Customers can insert order events" on public.service_order_events
  for insert
  with check (
    exists (
      select 1 from public.service_orders so
      where so.id = service_order_id
      and (
          exists (
            select 1 from public.customers c
            where c.id = so.customer_id
            and c.user_id = auth.uid()
          )
          OR
          exists (
              select 1 from public.customer_assets ca
              join public.customers c on ca.customer_id = c.id
              where ca.id = so.asset_id
              and c.user_id = auth.uid()
          )
      )
    )
  );
