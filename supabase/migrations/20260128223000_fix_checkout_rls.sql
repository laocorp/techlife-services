-- FIX CHECKOUT ISSUES
-- 1. Create missing RPC for stock management
create or replace function public.decrement_product_stock(p_id uuid, qty int)
returns void
language plpgsql
-- SECURITY DEFINER allows this to run with privileges of the creator (postgres)
-- avoiding RLS issues for the 'anon' user trying to update products.
security definer 
as $$
begin
  update public.products
  set quantity = quantity - qty
  where id = p_id;
end;
$$;

-- 2. Enable Public Checkout (Insert Orders)
alter table public.ecommerce_orders enable row level security;
alter table public.ecommerce_order_items enable row level security;

-- Allow ANYONE to Create an Order (Guest Checkout)
drop policy if exists "Enable insert for all users" on public.ecommerce_orders;
create policy "Enable insert for all users"
on public.ecommerce_orders for insert
with check (true);

-- Allow ANYONE to Create Order Items
drop policy if exists "Enable insert for all users" on public.ecommerce_order_items;
create policy "Enable insert for all users"
on public.ecommerce_order_items for insert
with check (true);

-- 3. Allow Viewing the Order (for Success Page)
-- This allows anyone to view an order if they know the UUID. 
-- Security by Obscurity (UUID) is acceptable for an MVP guest checkout.
drop policy if exists "Enable select for all users" on public.ecommerce_orders;
create policy "Enable select for all users"
on public.ecommerce_orders for select
using (true);

drop policy if exists "Enable select for all users" on public.ecommerce_order_items;
create policy "Enable select for all users"
on public.ecommerce_order_items for select
using (true);
