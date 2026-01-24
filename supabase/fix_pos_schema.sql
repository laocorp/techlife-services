-- 1. Ensure 'channel' column exists in ecommerce_orders
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'ecommerce_orders' and column_name = 'channel') then
        alter table public.ecommerce_orders 
        add column channel text not null default 'online' check (channel in ('online', 'pos'));
    end if;
end $$;

-- 2. Ensure payments link to ecommerce_orders
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'payments' and column_name = 'ecommerce_order_id') then
        alter table public.payments 
        add column ecommerce_order_id uuid references public.ecommerce_orders(id) on delete cascade;
        
        alter table public.payments 
        alter column service_order_id drop not null;
    end if;
end $$;

-- 3. FIX RLS POLICIES (Crucial for History View)
-- Old policy only allowed "own" orders. We need to allow reading ALL orders in the tenant for Staff.

drop policy if exists "Users can view own ecommerce orders" on public.ecommerce_orders;

create policy "Users can view tenant ecommerce orders" on public.ecommerce_orders
  for select using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid())
  );

-- Also allow insert for POS
drop policy if exists "Users can create own ecommerce orders" on public.ecommerce_orders;

create policy "Users can create tenant ecommerce orders" on public.ecommerce_orders
  for insert with check (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid())
  );
