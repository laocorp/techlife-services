-- Allow everyone to read tenant info (Name, Logo, Address are public business info)
create policy "Public Read Tenants"
on public.tenants
for select
using (true);
