-- Create a new private bucket for order evidence
insert into storage.buckets (id, name, public)
values ('order-evidence', 'order-evidence', false);

-- Policy: Allow users to view files in their tenant's folder
-- Assumption: Path structure is "tenant_id/order_id/filename"
create policy "Users can view own tenant evidence"
on storage.objects for select
using ( bucket_id = 'order-evidence' and (storage.foldername(name))[1]::uuid = (select tenant_id from public.profiles where id = auth.uid()) );

-- Policy: Allow users to upload files to their tenant's folder
create policy "Users can upload own tenant evidence"
on storage.objects for insert
with check ( bucket_id = 'order-evidence' and (storage.foldername(name))[1]::uuid = (select tenant_id from public.profiles where id = auth.uid()) );
