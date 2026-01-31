-- INSPECCION PROFUNDA DE DATOS
-- Vamos a ver exactamente qué está pasando en la base de datos.

-- 1. Ver tu perfil de cliente conectado (El que tiene el User ID)
select 'YOUR_PROFILE' as check_type, id, full_name, email, user_id 
from public.customers 
where user_id = '411773f1-9010-4099-8ff2-64254583174c';

-- 2. LISTAR LOS ULTIMOS 20 ACTIVOS REGISTRADOS EN TODO EL SISTEMA
-- Esto nos mostrará si "existen" los autos y a nombre de quién están.
select 
    ca.id as asset_id, 
    ca.identifier as auto_placa_o_nombre, 
    c.full_name as owner_name, 
    c.user_id as owner_has_login,
    c.id as owner_customer_id
from public.customer_assets ca
left join public.customers c on ca.customer_id = c.id
order by ca.created_at desc
limit 20;
