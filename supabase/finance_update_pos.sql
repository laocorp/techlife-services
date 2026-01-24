-- Allow payments to be linked to ecommerce_orders
alter table public.payments 
alter column service_order_id drop not null;

alter table public.payments
add column ecommerce_order_id uuid references public.ecommerce_orders(id) on delete cascade;

-- Optional constraint: ensure it links to something
alter table public.payments
add constraint payments_target_check 
check (
  (service_order_id is not null and ecommerce_order_id is null) or
  (service_order_id is null and ecommerce_order_id is not null)
);
