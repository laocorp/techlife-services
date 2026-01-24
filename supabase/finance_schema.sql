-- FINANCE MODULE SCHEMA

-- 1. Payments Table
create type payment_method as enum ('cash', 'card', 'transfer', 'other');

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  amount decimal(10, 2) not null check (amount > 0),
  method payment_method not null default 'cash',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 2. RLS Policies

alter table public.payments enable row level security;

create policy "Users can view payments in same tenant" on public.payments
  for select using (tenant_id = get_current_tenant_id());

create policy "Users can insert payments in same tenant" on public.payments
  for insert with check (tenant_id = get_current_tenant_id());

-- Only Owner/Admin can delete payments (Voiding)
create policy "Owners/Admins can delete payments in same tenant" on public.payments
  for delete using (
    tenant_id = get_current_tenant_id() 
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- 3. Triggers (Optional)
-- We could have a trigger to update "paid_amount" on service_orders if we added that column for performance.
-- For MVP, we will calculate it on the fly or use a view.
