-- PORTAL SCHEMA: Customer Authentication and Access

-- 1. Add user_id to customers to link with auth.users
alter table public.customers 
add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Index for searching customers by user_id
create index if not exists idx_customers_user_id on public.customers(user_id);

-- 2. RLS Policies for Customer Access

-- Customers can view their own profile/record
create policy "Portal: Customers can view own record" on public.customers
  for select using (auth.uid() = user_id);

-- Customers can view their own assets
create policy "Portal: Customers can view own assets" on public.customer_assets
  for select using (
    exists (
      select 1 from public.customers
      where id = customer_assets.customer_id
      and user_id = auth.uid()
    )
  );

-- Customers can view their own orders
create policy "Portal: Customers can view own orders" on public.service_orders
  for select using (
    exists (
      select 1 from public.customers
      where id = service_orders.customer_id
      and user_id = auth.uid()
    )
  );

-- Customers can view events of their own orders (only public events?)
-- For now let's allow all events or filter by type if needed. 
-- Let's restrict to 'status_change' and 'comment' for now to avoid showing internal notes if we had that distinction.
-- But currently event_type is generic. Let's start open and refine.
create policy "Portal: Customers can view own order events" on public.service_order_events
  for select using (
    exists (
      select 1 from public.service_orders
      join public.customers on service_orders.customer_id = customers.id
      where service_orders.id = service_order_events.service_order_id
      and customers.user_id = auth.uid()
    )
  );
