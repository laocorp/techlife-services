-- 20260213_fix_order_status_enum.sql
-- ADD 'cancelled' TO ORDER STATUS ENUM

-- In Supabase, you can't add to enum inside transaction easily, so we use execute
do $$
begin
    if not exists (select 1 from pg_enum where enumlabel = 'cancelled' and enumtypid = 'public.order_status'::regtype) then
        alter type public.order_status add value 'cancelled';
    end if;
end $$;
