-- Add Product Categories Table

create table if not exists public.product_categories (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- RLS for Categories
alter table public.product_categories enable row level security;

create policy "Users can view categories in same tenant" on public.product_categories
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can manage categories in same tenant" on public.product_categories
  for all using (tenant_id = get_current_tenant_id());

-- Update Products table to use category_id
-- We will first add the column, then (optionally) migrate data if needed, then drop old if desired.
-- For now, let's keep both but prefer category_id.

alter table public.products add column if not exists category_id uuid references public.product_categories(id) on delete set null;

-- Enable indexing for performance
create index if not exists idx_products_category_id on public.products(category_id);
