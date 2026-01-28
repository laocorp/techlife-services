drop policy if exists "Tenants can create sales orders" on public.sales_orders;

create policy "Tenants can create sales orders"
on public.sales_orders for insert
with check (
    tenant_id in (
        select tenant_id 
        from public.profiles 
        where id = auth.uid()
    )
);
