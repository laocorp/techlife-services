-- DANGER: DROPPING EVERYTHING TO START FRESH
-- Run this to reset the database schema completely
drop table if exists public.time_entries cascade;
drop table if exists public.service_order_events cascade;
drop table if exists public.service_orders cascade;
drop table if exists public.customer_assets cascade;
drop table if exists public.customers cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tenants cascade;

drop type if exists public.event_type cascade;
drop type if exists public.order_priority cascade;
drop type if exists public.order_status cascade;
drop type if exists public.user_status cascade;
drop type if exists public.user_role cascade;
drop type if exists public.industry_type cascade;

drop function if exists public.get_current_tenant_id cascade;
drop function if exists public.update_updated_at_column cascade;

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

----------------------------------------------------
-- 1. PUBLIC TABLES
----------------------------------------------------

-- TENANTS TABLE
create type industry_type as enum ('automotive', 'electronics', 'machinery');

create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  industry industry_type not null default 'automotive',
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PROFILES TABLE (Extends auth.users)
create type user_role as enum ('owner', 'admin', 'receptionist', 'technician');
create type user_status as enum ('active', 'inactive');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete restrict,
  full_name text,
  role user_role not null default 'receptionist',
  status user_status not null default 'active',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CUSTOMERS TABLE
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  tax_id text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CUSTOMER ASSETS (Vehicles/Devices)
create table public.customer_assets (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  identifier text not null, -- Placa, IMEI, Serie
  details jsonb default '{}'::jsonb,
  notes text,
  created_at timestamptz default now()
);

-- SERVICE ORDERS
create type order_status as enum ('reception', 'diagnosis', 'approval', 'repair', 'qa', 'ready', 'delivered');
create type order_priority as enum ('low', 'normal', 'high', 'urgent');

create table public.service_orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  folio_id serial, -- Simplified for MVP
  customer_id uuid references public.customers(id) on delete set null,
  asset_id uuid references public.customer_assets(id) on delete set null,
  status order_status not null default 'reception',
  priority order_priority not null default 'normal',
  assigned_to uuid references public.profiles(id),
  description_problem text,
  diagnosis_report text,
  estimated_delivery_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SERVICE ORDER EVENTS (Timeline)
create type event_type as enum ('status_change', 'comment', 'evidence', 'assignment');

create table public.service_order_events (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type event_type not null default 'comment',
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- TIME ENTRIES
create table public.time_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  technician_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  duration_minutes int,
  created_at timestamptz default now()
);

----------------------------------------------------
-- 2. RLS POLICIES
----------------------------------------------------

-- Helper function to get current user's tenant_id
create or replace function get_current_tenant_id()
returns uuid as $$
  select tenant_id from public.profiles
  where id = auth.uid()
$$ language sql security definer;

-- Enable RLS on all tables
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_assets enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_events enable row level security;
alter table public.time_entries enable row level security;

-- --- POLICIES ---

-- Tenants
create policy "Users can view their own tenant" on public.tenants
  for select using (id = get_current_tenant_id());
  
create policy "Anyone can create a tenant" on public.tenants
  for insert with check (true);

-- Profiles
create policy "Users can view profiles in same tenant" on public.profiles
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

-- Customers
create policy "Users can view customers in same tenant" on public.customers
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can insert customers in same tenant" on public.customers
  for insert with check (tenant_id = get_current_tenant_id());

create policy "Users can update customers in same tenant" on public.customers
  for update using (tenant_id = get_current_tenant_id());

-- Assets
create policy "Users can view assets in same tenant" on public.customer_assets
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can insert assets in same tenant" on public.customer_assets
  for insert with check (tenant_id = get_current_tenant_id());

create policy "Users can update assets in same tenant" on public.customer_assets
  for update using (tenant_id = get_current_tenant_id());

-- Orders
create policy "Users can view orders in same tenant" on public.service_orders
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can insert orders in same tenant" on public.service_orders
  for insert with check (tenant_id = get_current_tenant_id());

create policy "Users can update orders in same tenant" on public.service_orders
  for update using (tenant_id = get_current_tenant_id());

-- Events
create policy "Users can view events in same tenant" on public.service_order_events
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can insert events in same tenant" on public.service_order_events
  for insert with check (tenant_id = get_current_tenant_id());

-- Time Entries
create policy "Users can view time entries in same tenant" on public.time_entries
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can insert time entries in same tenant" on public.time_entries
  for insert with check (tenant_id = get_current_tenant_id());

create policy "Users can update time entries in same tenant" on public.time_entries
  for update using (tenant_id = get_current_tenant_id());


----------------------------------------------------
-- 3. TRIGGERS
----------------------------------------------------

create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_tenants_updated_at before update on public.tenants
for each row execute procedure update_updated_at_column();

create trigger update_profiles_updated_at before update on public.profiles
for each row execute procedure update_updated_at_column();

create trigger update_customers_updated_at before update on public.customers
for each row execute procedure update_updated_at_column();

create trigger update_service_orders_updated_at before update on public.service_orders
for each row execute procedure update_updated_at_column();