-- MANUAL DEPLOY SCRIPT
-- This script contains all recent changes to restore the production schema.
-- Run this ENTIRE SCRIPT in the Supabase SQL Editor.

-- STEP 1: CREATE E-COMMERCE TABLES (From ecommerce_schema.sql)
-- -----------------------------------------------------------

-- 1. Update PRODUCTS table
alter table public.products 
add column if not exists image_url text;

-- 2. Create SALES_ORDERS table (distinct from service_orders)
create table if not exists public.sales_orders (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone default now(),
    tenant_id uuid references public.tenants(id),
    customer_id uuid references public.customers(id),
    
    total_amount decimal(10,2) not null default 0,
    status text default 'new', -- new, paid, dispatched, delivered, cancelled
    
    -- Delivery Info
    delivery_method text not null default 'pickup', -- 'pickup', 'delivery'
    shipping_address text, -- Address for delivery
    shipping_cost decimal(10,2) default 0,
    contact_phone text,

    payment_status text default 'pending' -- pending, paid
);

-- RLS for sales_orders
alter table public.sales_orders enable row level security;

-- Policies for Sales Orders
drop policy if exists "Customers can view their own sales orders" on public.sales_orders;
create policy "Customers can view their own sales orders"
on public.sales_orders for select
using ( auth.uid() in (select user_id from public.customers where id = customer_id) );

drop policy if exists "Customers can create sales orders" on public.sales_orders;
create policy "Customers can create sales orders"
on public.sales_orders for insert
with check ( auth.uid() in (select user_id from public.customers where id = customer_id) );

drop policy if exists "Tenants can view their incoming sales orders" on public.sales_orders;
create policy "Tenants can view their incoming sales orders"
on public.sales_orders for select
using ( tenant_id in (select tenant_id from public.profiles where id = auth.uid()) );

drop policy if exists "Tenants can update sales orders" on public.sales_orders;
create policy "Tenants can update sales orders"
on public.sales_orders for update
using ( tenant_id in (select tenant_id from public.profiles where id = auth.uid()) );

-- 3. Sales Order Items
create table if not exists public.sales_order_items (
    id uuid not null default gen_random_uuid() primary key,
    order_id uuid references public.sales_orders(id) on delete cascade,
    product_id uuid references public.products(id),
    quantity integer default 1,
    unit_price decimal(10,2) not null,
    total decimal(10,2) generated always as (quantity * unit_price) stored
);

alter table public.sales_order_items enable row level security;

drop policy if exists "Order owner view items" on public.sales_order_items;
create policy "Order owner view items"
on public.sales_order_items for select
using ( 
    order_id in (select id from public.sales_orders) 
);

-- 4. Storage for Products
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public view product images" on storage.objects;
create policy "Public view product images"
on storage.objects for select
using ( bucket_id = 'product-images' );

drop policy if exists "Authenticated upload product images" on storage.objects;
create policy "Authenticated upload product images"
on storage.objects for insert
with check ( bucket_id = 'product-images' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated update product images" on storage.objects;
create policy "Authenticated update product images"
on storage.objects for update
using ( bucket_id = 'product-images' and auth.role() = 'authenticated' );


-- STEP 2: FIX LEGACY POS TABLES (From fix_pos_schema.sql)
-- -----------------------------------------------------------

-- 1. Ensure 'channel' column exists in ecommerce_orders
create table if not exists public.ecommerce_orders (
    id uuid not null default gen_random_uuid() primary key,
    tenant_id uuid, -- Simplified, normally references tenants
    created_at timestamp with time zone default now()
); -- Stub creation if missing, usually existing.

do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'ecommerce_orders' and column_name = 'channel') then
        alter table public.ecommerce_orders 
        add column channel text not null default 'online';
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

-- STEP 3: SECURITY & PERFORMANCE AUDIT (From audit_security.sql)
-- -----------------------------------------------------------

-- 1. Ensure RLS is enabled on ALL used tables
alter table if exists public.sales_orders enable row level security;
alter table if exists public.sales_order_items enable row level security;
alter table if exists public.ecommerce_orders enable row level security;
alter table if exists public.payments enable row level security;

-- 2. Enhance Sales Order Items Policy
drop policy if exists "Public insert items" on public.sales_order_items;
drop policy if exists "Authorized insert items" on public.sales_order_items;

create policy "Authorized insert items"
on public.sales_order_items for insert
with check (
    exists (
        select 1 from public.sales_orders so
        where so.id = order_id
        and (
            (auth.uid() in (select user_id from public.customers where id = so.customer_id))
            OR
            (so.tenant_id in (select tenant_id from public.profiles where id = auth.uid()))
            OR
            (so.status = 'new')
        )
    )
);

-- 3. Fix Payments RLS
drop policy if exists "Tenants view/manage payments" on public.payments;

create policy "Tenants view/manage payments"
on public.payments
for all
using ( tenant_id in (select tenant_id from public.profiles where id = auth.uid()) );

-- 4. Indexes
create index if not exists idx_sales_orders_tenant on public.sales_orders(tenant_id);
create index if not exists idx_sales_orders_customer on public.sales_orders(customer_id);
create index if not exists idx_sales_order_items_order on public.sales_order_items(order_id);
create index if not exists idx_products_tenant on public.products(tenant_id);
create index if not exists idx_products_public on public.products(is_public);
create index if not exists idx_payments_created_at on public.payments(created_at);
create index if not exists idx_sales_orders_created_at on public.sales_orders(created_at);
