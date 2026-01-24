-- FIX PORTAL PERMISSIONS
-- Run this to ensure your consumer user can read their own linked data

-- 1. Ensure user_id column exists in customers (it should, but just in case)
-- alter table public.customers add column if not exists user_id uuid references auth.users(id);

-- 2. Grant Permissions
-- Allow users to see customers records linked to them
drop policy if exists "Portal: Customers can view own record" on public.customers;
create policy "Portal: Customers can view own record" on public.customers
  for select using ( auth.uid() = user_id );

-- Allow users to see ASSETS belonging to their customer records
drop policy if exists "Portal: Customers can view own assets" on public.customer_assets;
create policy "Portal: Customers can view own assets" on public.customer_assets
  for select using (
    exists (
      select 1 from public.customers
      where id = customer_assets.customer_id
      and user_id = auth.uid()
    )
  );

-- Allow users to see ORDERS for their vehicles
drop policy if exists "Portal: Customers can view own orders" on public.service_orders;
create policy "Portal: Customers can view own orders" on public.service_orders
  for select using (
    exists (
      select 1 from public.customers
      where id = service_orders.customer_id
      and user_id = auth.uid()
    )
  );
