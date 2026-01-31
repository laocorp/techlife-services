-- FIX PORTAL VISIBILITY ISSUES (RLS)

-- 1. CUSTOMERS: Allow users to view their own customer profiles
-- This is required for the !inner join to work when fetching assets.
alter table public.customers enable row level security;

create policy "Users can view own customer profiles"
on public.customers for select
using (
    user_id = auth.uid()
);

-- 2. CUSTOMER ASSETS (Workshop Assets): Allow users to view assets linked to them
-- We join with customers table to check if the asset belongs to a customer linked to the current user.
alter table public.customer_assets enable row level security;

create policy "Users can view own workshop assets"
on public.customer_assets for select
using (
    exists (
        select 1 from public.customers c
        where c.id = public.customer_assets.customer_id
        and c.user_id = auth.uid()
    )
);
