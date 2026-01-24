-- Check if bucket exists
select * from storage.buckets where id = 'branding';

-- Check policies
select * from pg_policies where tablename = 'objects' and policyname like '%Branding%';

-- Force Update Policy (Permissive)
drop policy if exists "Authenticated Users can upload Branding" on storage.objects;
drop policy if exists "Users can update own branding" on storage.objects;
drop policy if exists "Public Access for Branding" on storage.objects;

-- 1. READ: Public
create policy "Public Access for Branding"
on storage.objects for select
using ( bucket_id = 'branding' );

-- 2. INSERT: Authenticated
create policy "Authenticated Insert Branding"
on storage.objects for insert
with check ( bucket_id = 'branding' and auth.role() = 'authenticated' );

-- 3. UPDATE: Authenticated (needed for upsert/overwrite)
create policy "Authenticated Update Branding"
on storage.objects for update
using ( bucket_id = 'branding' and auth.role() = 'authenticated' )
with check ( bucket_id = 'branding' and auth.role() = 'authenticated' );

-- 4. DELETE: Authenticated (optional, but good for cleanup)
create policy "Authenticated Delete Branding"
on storage.objects for delete
using ( bucket_id = 'branding' and auth.role() = 'authenticated' );
