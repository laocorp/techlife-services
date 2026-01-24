-- Secure function to get order details for public tracking
-- bypassing RLS (security definer) but strictly strictly limited by ID.

create or replace function public.get_tracking_info(p_order_id uuid)
returns jsonb
language plpgsql
security definer -- Bypass RLS
as $$
declare
    v_order record;
    v_events jsonb;
    v_tenant_name text;
begin
    -- 1. Fetch Order Basic Info
    select 
        o.folio_id, 
        o.status, 
        o.updated_at,
        o.estimated_delivery_date,
        c.full_name as customer_name,
        a.identifier as asset_identifier,
        a.details as asset_details,
        t.name as tenant_name
    into v_order
    from public.service_orders o
    join public.customers c on o.customer_id = c.id
    join public.customer_assets a on o.asset_id = a.id
    join public.tenants t on o.tenant_id = t.id
    where o.id = p_order_id;

    if v_order is null then
        return null;
    end if;

    -- 2. Fetch Public Events (status changes and comments marked public - for now all status changes)
    select jsonb_agg(
        jsonb_build_object(
            'created_at', created_at,
            'type', type,
            'content', content
        ) order by created_at desc
    )
    into v_events
    from public.service_order_events
    where service_order_id = p_order_id
    and type in ('status_change'); -- Only show status changes to public for now

    -- 3. Return JSON
    return jsonb_build_object(
        'folio', v_order.folio_id,
        'status', v_order.status,
        'updated_at', v_order.updated_at,
        'estimated_date', v_order.estimated_delivery_date,
        'customer', v_order.customer_name, -- Maybe mask this? Keeping full for now as they have the link
        'device', v_order.asset_identifier,
        'device_details', v_order.asset_details,
        'tenant', v_order.tenant_name,
        'timeline', coalesce(v_events, '[]'::jsonb)
    );
end;
$$;
