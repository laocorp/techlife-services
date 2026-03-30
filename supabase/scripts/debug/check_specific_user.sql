-- =============================================
-- DIAGNOSTICO DE USUARIO ESPECÍFICO
-- =============================================
-- Verifica si el usuario existe en Auth y tiene perfil asociado.

DO $$
DECLARE
    v_email text := 'danhelic2011paypal@gmail.com'; -- Lowercase
    v_user_id uuid;
    v_profile_exists boolean;
    v_tenant_id uuid;
    v_profile_role public.user_role;
BEGIN
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE '🔎 Buscando usuario: %', v_email;

    -- 1. Check Auth User
    SELECT id INTO v_user_id FROM auth.users WHERE email ILIKE v_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ EL USUARIO NO EXISTE EN AUTH.USERS (No esta registrado)';
    ELSE
        RAISE NOTICE '✅ Usuario encontrado en Auth (ID: %)', v_user_id;
        
        -- 2. Check Profile
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
        
        IF NOT v_profile_exists THEN
            RAISE NOTICE '❌ EL PERFIL NO EXISTE EN PUBLIC.PROFILES (Correr script fix_owner_manual.sql)';
        ELSE
            SELECT role, tenant_id INTO v_profile_role, v_tenant_id FROM public.profiles WHERE id = v_user_id;
            RAISE NOTICE '✅ Perfil encontrado.';
            RAISE NOTICE '   - Rol: %', v_profile_role;
            RAISE NOTICE '   - Tenant ID: %', v_tenant_id;
            
            -- 3. Check Tenant
            IF v_tenant_id IS NULL THEN
                 RAISE NOTICE '❌ ERROR CRITICO: Tenant ID es NULL.';
            ELSE
                 PERFORM 1 FROM public.tenants WHERE id = v_tenant_id;
                 IF NOT FOUND THEN
                    RAISE NOTICE '❌ ERROR CRITICO: El Tenant ID % no existe en la tabla tenants.', v_tenant_id;
                 ELSE
                    RAISE NOTICE '✅ Tenant válido.';
                 END IF;
            END IF;
        END IF;
    END IF;
    RAISE NOTICE '---------------------------------------------------';
END $$;
