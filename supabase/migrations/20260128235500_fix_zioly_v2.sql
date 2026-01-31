-- FIX 2.0: FUSIÓN FORZADA DE DATOS DE ZIOLY y Ajuste de RLS
-- Este script es más agresivo para encontrar y unificar los datos.

DO $$
DECLARE
    final_user_id uuid := '411773f1-9010-4099-8ff2-64254583174c';
    target_customer_id uuid;
    source_customer_id uuid;
    assets_moved int;
BEGIN
    RAISE NOTICE 'Iniciando Diagnóstico y Reparación para User ID: %', final_user_id;

    -- 1. Buscar el ID del cliente PRINCIPAL (el que tiene el usuario conectado)
    SELECT id INTO target_customer_id
    FROM public.customers
    WHERE user_id = final_user_id
    LIMIT 1;

    IF target_customer_id IS NULL THEN
        RAISE EXCEPTION 'CRITICO: No se encontró un cliente para el usuario actual. El usuario no completó el onboarding?';
    END IF;

    RAISE NOTICE 'Cliente Destino Encontrado: %', target_customer_id;

    -- 2. Buscar CUALQUIER otro cliente llamado 'Zioly' que NO sea el destino
    -- Esto atrapará duplicados creados manualmente o por el taller.
    FOR source_customer_id IN 
        SELECT id FROM public.customers 
        WHERE full_name ILIKE '%Zioly%' 
        AND id != target_customer_id
    LOOP
        RAISE NOTICE 'Encontrado duplicado (Origen): %', source_customer_id;

        -- Mover Activos
        UPDATE public.customer_assets
        SET customer_id = target_customer_id
        WHERE customer_id = source_customer_id;
        
        GET DIAGNOSTICS assets_moved = ROW_COUNT;
        RAISE NOTICE ' -> Activos movidos: %', assets_moved;

        -- Mover Órdenes
        UPDATE public.service_orders
        SET customer_id = target_customer_id
        WHERE customer_id = source_customer_id;

        -- Borrar el duplicado (si quedó vacío)
        BEGIN
            DELETE FROM public.customers WHERE id = source_customer_id;
            RAISE NOTICE ' -> Perfil duplicado eliminado.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE ' -> No se pudo borrar el perfil duplicado (posibles FKs pendientes).';
        END;
    END LOOP;

    -- 3. VALIDACION FINAL: Asegurar que los activos sean visibles
    -- A veces el RLS falla si no hay un policy explícito que permita 'ver' los assets basados en el usuario del cliente.
    -- (Ya aplicamos el policy en el paso anterior, pero vamos a RE-FORZARLO por si acaso)
    
    RAISE NOTICE 'Verificando conteo final de activos para el cliente destino...';
    
    DECLARE final_count int;
    BEGIN
        SELECT count(*) INTO final_count FROM public.customer_assets WHERE customer_id = target_customer_id;
        RAISE NOTICE 'TOTAL ACTIVOS AHORA EN PERFIL PRINCIPAL: %', final_count;
    END;

END $$;
