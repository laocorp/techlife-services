-- PHASE 7: STore Improvements & Notifications
-- 1. Add payment_proof_url to ecommerce_orders
alter table public.ecommerce_orders 
add column if not exists payment_proof_url text;

-- 2. Create Storage Bucket for Payment Proofs
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- 3. Storage Policies for Payment Proofs
-- Allow ANYONE (Guest) to upload proof
drop policy if exists "Guests can upload proofs" on storage.objects;
create policy "Guests can upload proofs"
on storage.objects for insert
with check (
    bucket_id = 'payment-proofs' 
    -- Allow anon uploads for checkout
);

-- Allow Staff to VIEW proofs
drop policy if exists "Staff can view proofs" on storage.objects;
create policy "Staff can view proofs"
on storage.objects for select
using (
    bucket_id = 'payment-proofs'
    and auth.role() = 'authenticated'
    and exists (select 1 from public.profiles where id = auth.uid())
);

-- 4. Enable Realtime for Notifications
-- Ensure ecommerce_orders is published to realtime
-- (This usually requires enabling it in the dashboard, but we can try via SQL if extensions allows)
-- drop publication if exists supabase_realtime;
-- create publication supabase_realtime for table public.ecommerce_orders;
-- Note: 'supabase_realtime' publication usually exists. We add the table to it.
alter publication supabase_realtime add table public.ecommerce_orders;
