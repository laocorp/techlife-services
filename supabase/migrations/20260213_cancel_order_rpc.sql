
-- 20260213_cancel_order_rpc.sql
-- SECURE FUNCTION TO CANCEL ORDERS
-- This function runs with SECURITY DEFINER privileges (Admin) to bypass RLS
-- but strictly checks roles inside the function logic.

create or replace function public.cancel_order_endpoint(
    p_order_id uuid,
    p_reason text
)
returns json
language plpgsql
security definer -- RUN AS ADMIN (Bypasses RLS)
as $$
declare
    v_user_id uuid;
    v_tenant_id uuid;
    v_user_role public.user_role;
    v_order_status text;
    v_order_tenant_id uuid;
    v_item record;
begin
    -- 1. GET CURRENT USER INFO
    v_user_id := auth.uid();
    
    if v_user_id is null then
        return json_build_object('success', false, 'error', 'No autenticado');
    end if;

    select tenant_id, role into v_tenant_id, v_user_role
    from public.profiles
    where id = v_user_id;

    -- 2. CHECK PERMISSIONS (Cashier, Manager, Owner, Head Technician)
    if v_user_role not in ('cashier', 'manager', 'owner', 'head_technician') then
        return json_build_object('success', false, 'error', 'No tienes permisos para cancelar órdenes');
    end if;

    -- 3. GET ORDER INFO & LOCK ROW
    select status, tenant_id into v_order_status, v_order_tenant_id
    from public.service_orders
    where id = p_order_id
    for update; -- Lock to prevent race conditions

    if not found then
        return json_build_object('success', false, 'error', 'Orden no encontrada');
    end if;

    -- 4. CHECK TENANT ISOLATION
    if v_tenant_id != v_order_tenant_id then
        return json_build_object('success', false, 'error', 'No puedes acceder a órdenes de otro taller');
    end if;

    -- 5. CHECK STATUS
    if v_order_status = 'cancelled' then
        return json_build_object('success', false, 'error', 'La orden ya está cancelada');
    end if;

    -- 6. CANCEL ORDER
    update public.service_orders
    set status = 'cancelled',
        description_problem = description_problem || ' [CANCELADO: ' || p_reason || ']'
    where id = p_order_id;

    -- 7. RESTORE STOCK (Loop through items)
    for v_item in 
        select product_id, quantity 
        from public.service_order_items 
        where service_order_id = p_order_id
    loop
        -- Insert movement (Trigger will handle stock update)
        insert into public.inventory_movements (
            tenant_id,
            product_id,
            type,
            quantity,
            notes,
            created_by
        ) values (
            v_tenant_id,
            v_item.product_id,
            'in', -- IN = Restore stock
            v_item.quantity,
            'Cancelación Orden #' || substring(p_order_id::text, 1, 8),
            v_user_id
        );
    end loop;

    return json_build_object('success', true);

exception when others then
    return json_build_object('success', false, 'error', SQLERRM);
end;
$$;
