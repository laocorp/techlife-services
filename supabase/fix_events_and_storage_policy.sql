-- 1. DROP EXISTING POLICIES TO AVOID CONFLICTS
drop policy if exists "Portal: Customers can view own order events" on public.service_order_events;
drop policy if exists "Portal: Customers can view own evidence files" on storage.objects;

-- 2. Allow customers to view EVENTS of their own orders
create policy "Portal: Customers can view own order events" on public.service_order_events
  for select using (
    exists (
      select 1 from public.service_orders so
      where so.id = service_order_events.service_order_id
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

-- 3. Allow customers to view EVIDENCE FILES in storage
-- Path format: tenant_id/order_id/filename

create policy "Portal: Customers can view own evidence files"
on storage.objects for select
using (
  bucket_id = 'order-evidence'
  and exists (
    select 1 from public.service_orders so
    where so.id::text = (storage.foldername(name))[2] -- Match Order ID in path
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
