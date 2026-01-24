-- INVENTORY MODULE SCHEMA

-- 0. Helper Function for Updated At (Missing in base schema)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- 1. Product Types Enum
create type product_type as enum ('product', 'service');

-- 2. Products / Services Table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  sku text, -- Barcode / Identifier
  type product_type not null default 'product',
  quantity integer not null default 0, -- Current stock
  min_stock integer default 0, -- Alert threshold
  cost_price decimal(10, 2) default 0,
  sale_price decimal(10, 2) default 0,
  category text, -- Can be a foreign key later if needed, text for MVP
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique SKU per tenant (optional coverage)
create unique index idx_products_sku_tenant on public.products(tenant_id, sku) where sku is not null;

-- 3. Inventory Movements Table (Log of all stock changes)
create type movement_type as enum ('in', 'out', 'adjustment');

create table public.inventory_movements (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type movement_type not null,
  quantity integer not null, -- Positive for IN, Negative for OUT usually, but we can store absolute and use type
  reference_id uuid, -- Link to Purchase Order or Service Order
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 4. Service Order Items (Connection between Orders and Products/Services)
create table public.service_order_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  product_id uuid not null references public.products(id), -- No cascade on delete usually to keep history? or cascade? Let's keep data integrity.
  quantity integer not null default 1,
  unit_price decimal(10, 2) not null, -- Snapshot of price at moment of adding
  total decimal(10, 2) generated always as (quantity * unit_price) stored, -- Auto-calc
  created_at timestamptz default now()
);


-- RLS POLICIES --------------------------------------------------

-- Products
alter table public.products enable row level security;

create policy "Users can view products in same tenant" on public.products
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can insert products in same tenant" on public.products
  for insert with check (tenant_id = get_current_tenant_id());

create policy "Users can update products in same tenant" on public.products
  for update using (tenant_id = get_current_tenant_id());

create policy "Users can delete products in same tenant" on public.products
  for delete using (tenant_id = get_current_tenant_id());

-- Movements
alter table public.inventory_movements enable row level security;

create policy "Users can view movements in same tenant" on public.inventory_movements
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can insert movements in same tenant" on public.inventory_movements
  for insert with check (tenant_id = get_current_tenant_id());

-- Service Order Items
alter table public.service_order_items enable row level security;

create policy "Users can view order items in same tenant" on public.service_order_items
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can manage order items in same tenant" on public.service_order_items
  for all using (tenant_id = get_current_tenant_id());


-- TRIGGERS (Optional but recommended for consistency) ---------------

-- Update timestamp for products
create trigger update_products_modtime
    before update on public.products
    for each row execute procedure public.handle_updated_at();

-- Auto-update Stock Quantity on Movement Insert
-- This logic is complex in SQL. For MVP we might do it in App logic (Server Action) 
-- OR use a simple trigger.
-- Let's try a simple trigger for robustness.

create or replace function update_stock_from_movement()
returns trigger as $$
begin
  if NEW.type = 'in' then
    update public.products set quantity = quantity + NEW.quantity 
    where id = NEW.product_id;
  elsif NEW.type = 'out' then
    update public.products set quantity = quantity - NEW.quantity 
    where id = NEW.product_id;
  elsif NEW.type = 'adjustment' then
    -- Adjustment: quantity is the DELTA. Positive adds, Negative removes.
    update public.products set quantity = quantity + NEW.quantity 
    where id = NEW.product_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger tr_update_stock
after insert on public.inventory_movements
for each row execute procedure update_stock_from_movement();
