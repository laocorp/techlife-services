-- Allow Staff/Tenants to UPDATE orders (e.g. Confirm Payment)
-- Previously only INSERT and SELECT were allowed.

create policy "Enable update for authenticated users"
on public.ecommerce_orders for update
to authenticated
using (true)
with check (true);
