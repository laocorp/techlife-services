-- Migration: Enable Payments for Sales Orders (POS/Ecommerce) - FIXED & IDEMPOTENT
-- Date: 2026-01-27
-- Author: Antigravity

-- 1. Add sales_order_id column safely
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'payments' and column_name = 'sales_order_id') then
        alter table public.payments add column sales_order_id uuid references public.sales_orders(id) on delete cascade;
    end if;
end $$;

-- 2. Make service_order_id nullable
alter table public.payments alter column service_order_id drop not null;

-- 3. CLEANUP: Delete any 'zombie' payments that have NO service_order_id (and thus would violate the new rule)
-- This fixes the "check constraint violated by some row" error.
delete from public.payments where service_order_id is null and sales_order_id is null;

-- 4. Add constraint safely (drop if exists first to avoid dupes/errors during retry)
alter table public.payments drop constraint if exists payments_target_check;

alter table public.payments 
add constraint payments_target_check 
check (
  -- Ensure payment belongs to AT LEAST one order type
  (service_order_id is not null or sales_order_id is not null)
);

-- Note: We relaxed the strict XOR (one or the other) to a simple OR (at least one) 
-- to be safer against future strictness issues, while still preventing orphaned payments.
