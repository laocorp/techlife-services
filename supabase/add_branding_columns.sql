-- 1. Update Tenants Table
alter table public.tenants 
add column if not exists logo_url text,
add column if not exists website text,
add column if not exists address text,
add column if not exists city text;

-- 2. Update Customers Table
alter table public.customers 
add column if not exists avatar_url text;

-- ensure user_id exists (it should, but safety first)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='customers' and column_name='user_id') then
        alter table public.customers add column user_id uuid references auth.users(id);
    end if;
end $$;

-- 3. Create Storage Bucket for Branding
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do update set public = true;

-- 4. Storage Policies
drop policy if exists "Public Access for Branding" on storage.objects;
create policy "Public Access for Branding"
on storage.objects for select
using ( bucket_id = 'branding' );

drop policy if exists "Authenticated Users can upload Branding" on storage.objects;
create policy "Authenticated Users can upload Branding"
on storage.objects for insert
with check ( bucket_id = 'branding' and auth.role() = 'authenticated' );

drop policy if exists "Users can update own branding" on storage.objects;
create policy "Users can update own branding"
on storage.objects for update
using ( bucket_id = 'branding' and auth.role() = 'authenticated' );
