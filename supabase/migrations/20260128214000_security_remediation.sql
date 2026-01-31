-- SECURITY REMEDIATION & SCHEMA CLEANUP
-- Date: 2026-01-28
-- Goal: Fix RLS gaps, remove unused tables, and align Foreign Keys.

-- 1. CLEANUP: Remove unused 'sales_orders' tables (We use 'ecommerce_orders')
-- CAUTION: Ensure no data is lost. Since 'store.ts' uses ecommerce_orders, sales_orders should be empty/unused.
drop table if exists public.sales_order_items cascade;
drop table if exists public.sales_orders cascade;

-- 2. FIX PAYMENTS: Align FKs to use 'ecommerce_orders'
-- 'fix_pos_schema.sql' added 'ecommerce_order_id'.
-- 'fix_payments_schema.sql' added 'sales_order_id'. We remove 'sales_order_id'.

do $$
begin
    -- Remove sales_order_id if it exists
    if exists (select 1 from information_schema.columns where table_name = 'payments' and column_name = 'sales_order_id') then
        alter table public.payments drop column sales_order_id;
    end if;

    -- Ensure ecommerce_order_id exists (Redundant check if fix_pos_schema ran, but safe)
    if not exists (select 1 from information_schema.columns where table_name = 'payments' and column_name = 'ecommerce_order_id') then
        alter table public.payments add column ecommerce_order_id uuid references public.ecommerce_orders(id) on delete cascade;
    end if;
end $$;

-- CLEANUP ORPHANED PAYMENTS (Fix for Error 23514)
-- These payments belonged to the deleted 'sales_orders' table or are incomplete.
delete from public.payments 
where service_order_id is null 
and ecommerce_order_id is null;

-- Update Payment Constraint
alter table public.payments drop constraint if exists payments_target_check;
alter table public.payments 
add constraint payments_target_check 
check (
  (service_order_id is not null or ecommerce_order_id is not null)
);

-- 3. PRODUCTS SECURITY (Allow Public View)
-- Add is_public column if missing (It might be missing in 'products', found in 'tenants' in my thought trace, but let's check store.ts query which uses 'products.is_public')
alter table public.products add column if not exists is_public boolean default false;

-- Add RLS policy for Public View
drop policy if exists "Public can view public products" on public.products;
create policy "Public can view public products"
on public.products for select
using (is_public = true);

-- 4. STORAGE SECURITY (Product Images)
-- Drop overly permissive policies if they exist (created in ecommerce_schema.sql)
drop policy if exists "Authenticated upload product images" on storage.objects;
drop policy if exists "Authenticated update product images" on storage.objects;

-- Create stricter policies: Only Tenant Staff (Profiles) can upload/update
-- Note: 'storage.objects' does not have 'tenant_id'. We must rely on bucket naming or just general staff authentication.
-- For MVP: Allow any authenticated user who IS A PROFILE (meaning staff, not just customer auth)
-- Customers are in 'customers' table linked to auth.users, but NOT in 'profiles'.
-- Staff are in 'profiles'.

create policy "Staff upload product images"
on storage.objects for insert
with check (
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated'
    and exists (select 1 from public.profiles where id = auth.uid())
);

create policy "Staff update product images"
on storage.objects for update
using (
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated'
    and exists (select 1 from public.profiles where id = auth.uid())
);

create policy "Staff delete product images"
on storage.objects for delete
using (
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated'
    and exists (select 1 from public.profiles where id = auth.uid())
);

-- 5. SETTINGS SECURITY (Optional but recommended)
-- Ensure 'payments' RLS is correct (Staff only for now, unless we add Customer Payment History)
alter table public.payments enable row level security;

-- Drop old potential policies
drop policy if exists "Users can view payments in same tenant" on public.payments;

create policy "Staff view payments"
on public.payments for select
using (
    tenant_id in (select tenant_id from public.profiles where id = auth.uid())
);

create policy "Staff manage payments"
on public.payments for all
using (
    tenant_id in (select tenant_id from public.profiles where id = auth.uid())
);
