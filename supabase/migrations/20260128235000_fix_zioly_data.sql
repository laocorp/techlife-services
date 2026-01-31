-- CORRECCION DE DATOS: Fusionar perfiles de Zioly
-- Objetivo: Mover los activos del perfil "huérfano" al perfil conectado al usuario.

DO $$
DECLARE
    target_customer_id uuid;
    source_customer_id uuid;
BEGIN
    -- 1. Identificar el perfil CONECTADO (al que queremos mover las cosas)
    SELECT id INTO target_customer_id
    FROM public.customers
    WHERE user_id = '411773f1-9010-4099-8ff2-64254583174c'
    LIMIT 1;

    -- 2. Identificar el perfil HUÉRFANO (el que tiene los datos pero no el user_id)
    -- Buscamos por nombre aproximado y que NO tenga user_id
    SELECT id INTO source_customer_id
    FROM public.customers
    WHERE full_name ILIKE '%Zioly%' 
    AND user_id IS NULL
    LIMIT 1;

    -- Validar que ambos existan
    IF target_customer_id IS NOT NULL AND source_customer_id IS NOT NULL THEN
        RAISE NOTICE 'Fusionando perfil % (Origen) hacia % (Destino)', source_customer_id, target_customer_id;

        -- 3. Mover Activos (Vehículos/Equipos)
        UPDATE public.customer_assets
        SET customer_id = target_customer_id
        WHERE customer_id = source_customer_id;

        -- 4. Mover Órdenes de Servicio (Reparaciones antiguas)
        UPDATE public.service_orders
        SET customer_id = target_customer_id
        WHERE customer_id = source_customer_id;

        -- 5. Eliminar el perfil duplicado vacío
        DELETE FROM public.customers
        WHERE id = source_customer_id;
        
        RAISE NOTICE 'Fusión completada exitosamente.';
    ELSE
        RAISE NOTICE 'No se encontraron los perfiles duplicados esperados. Verifique los datos.';
    END IF;
END $$;
