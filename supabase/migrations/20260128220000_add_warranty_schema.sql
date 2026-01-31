-- Add Warranty Support to Service Orders

-- 1. Add columns to link back to original order
alter table public.service_orders 
add column if not exists original_order_id uuid references public.service_orders(id),
add column if not exists is_warranty boolean default false;

-- 2. Index for faster lookups of warranty history
create index if not exists idx_service_orders_original_order on public.service_orders(original_order_id);

-- 3. Update RLS (Policies usually cover 'all', but good to review if we need specific rules)
-- Standard policies for 'view' and 'update' should suffice as they are based on tenant_id.

-- 4. KPI Views (Optional) - Tasa de Retorno
-- Validar si necesitamos una vista para facilitar el cálculo de garantías por técnico.
create or replace view public.view_technician_returns as
select 
    original.assigned_to as technician_id,
    count(*) as total_warranties
from public.service_orders warranties
join public.service_orders original on warranties.original_order_id = original.id
where warranties.is_warranty = true
group by original.assigned_to;
