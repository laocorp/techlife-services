-- DIAGNOSTICO DE DATOS (DATA DIAGNOSTIC)

-- 1. Ver qué cliente está conectado a este Usuario (User ID del screenshot)
select 'CONNECTED_PROFILE' as check_type, id, full_name, email, user_id 
from public.customers 
where user_id = '411773f1-9010-4099-8ff2-64254583174c';

-- 2. Ver cuántos activos tiene ese cliente específico
select 'ASSETS_COUNT' as check_type, count(*) 
from public.customer_assets 
where customer_id in (
    select id from public.customers where user_id = '411773f1-9010-4099-8ff2-64254583174c'
);

-- 3. Buscar posibles duplicados por nombre "Zioly" (Orchan Records)
-- Esto nos dirá si existe OTRO cliente "Zioly" que tiene los activos pero no el user_id.
select 'POTENTIAL_DUPLICATES' as check_type, c.id, c.full_name, c.email, c.user_id, count(ca.id) as total_assets
from public.customers c
left join public.customer_assets ca on ca.customer_id = c.id
where c.full_name ilike '%Zioly%'
group by c.id, c.full_name, c.email, c.user_id;
