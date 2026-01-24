-- Enable RLS on tenants if not already (it should be)
alter table public.tenants enable row level security;

-- Policy to allow users to UPDATE their own tenant
-- Access is granted if the user's profile is linked to this tenant
create policy "Users can update their own tenant"
on public.tenants
for update
using (
  id in (
    select tenant_id 
    from public.profiles 
    where id = auth.uid()
  )
)
with check (
  id in (
    select tenant_id 
    from public.profiles 
    where id = auth.uid()
  )
);

-- Also ensure INSERT permission is strictly controlled or handled by system, 
-- usually tenants are created on signup. We just need UPDATE here.

-- Verify profiles RLS as well just in case (needed for the subquery to work if RLS is on profiles too)
-- Profiles usually allows users to read their own profile.

-- Let's double check storage permissions again just to be safe (Bucket 'branding')
-- (This part repeats what we did, but ensures consistency)
insert into storage.buckets (id, name, public) values ('branding', 'branding', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated Insert Branding" on storage.objects;
create policy "Authenticated Insert Branding"
on storage.objects for insert
with check ( bucket_id = 'branding' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated Update Branding" on storage.objects;
create policy "Authenticated Update Branding"
on storage.objects for update
using ( bucket_id = 'branding' and auth.role() = 'authenticated' );
