-- 1. Update PRODUCTS table
alter table public.products 
add column if not exists image_url text;

-- 2. Create SALES_ORDERS table (distinct from service_orders)
-- If we want to unify, we could, but sales orders have different lifecycle (New -> Paid -> Shipped -> Delivered)
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
create policy "Customers can view their own sales orders"
on public.sales_orders for select
using ( auth.uid() in (select user_id from public.customers where id = customer_id) );

create policy "Customers can create sales orders"
on public.sales_orders for insert
with check ( auth.uid() in (select user_id from public.customers where id = customer_id) );

create policy "Tenants can view their incoming sales orders"
on public.sales_orders for select
using ( tenant_id in (select tenant_id from public.profiles where id = auth.uid()) );

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

create policy "Order owner view items"
on public.sales_order_items for select
using ( 
    order_id in (select id from public.sales_orders) 
    -- Simplified for brevity, relying on order RLS access usually, but for strictness:
    -- exists (select 1 from public.sales_orders where id = order_id and ... logic ... )
    -- Let's just allow read if you can read the order
);

create policy "Public insert items"
on public.sales_order_items for insert
with check (true); -- Usually inserted by server action or customer during checkout

-- 4. Storage for Products
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public view product images"
on storage.objects for select
using ( bucket_id = 'product-images' );

create policy "Authenticated upload product images"
on storage.objects for insert
with check ( bucket_id = 'product-images' and auth.role() = 'authenticated' );

create policy "Authenticated update product images"
on storage.objects for update
using ( bucket_id = 'product-images' and auth.role() = 'authenticated' );
