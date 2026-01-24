-- Storage Bucket for Product Images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Policies for Product Images

-- 1. Public can view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

-- 2. Authenticated users (staff) can upload images
create policy "Staff Upload Access"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated'
  );

-- 3. Authenticated users can update/delete their images (or all images for simplicity in this MVP)
create policy "Staff Update/Delete Access"
  on storage.objects for update
  using ( bucket_id = 'product-images' and auth.role() = 'authenticated' );

create policy "Staff Delete Access"
  on storage.objects for delete
  using ( bucket_id = 'product-images' and auth.role() = 'authenticated' );
