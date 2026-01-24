-- Insert a test notification for the current user's tenant
-- We need to find a valid tenant_id. We'll pick one from the tenants table or use the first one found.

do $$
declare
  v_tenant_id uuid;
begin
  select id into v_tenant_id from public.tenants limit 1;

  if v_tenant_id is not null then
    insert into public.notifications (tenant_id, title, message, link, is_read)
    values (v_tenant_id, 'Prueba de Sistema', 'Esta es una notificación de prueba para verificar la campana.', '/dashboard', false);
  end if;
end $$;
