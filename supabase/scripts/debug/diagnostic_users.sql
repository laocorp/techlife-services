-- =============================================
-- DIAGNOSTIC SCRIPT: CHECK USERS & PROFILES
-- =============================================

DO $$
DECLARE
    v_user RECORD;
    v_profile RECORD;
    v_missing_profiles INT := 0;
    v_mismatched_roles INT := 0;
BEGIN
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'DIAGNOSTICO DE USUARIOS Y PERFILES';
    RAISE NOTICE '---------------------------------------------------';

    FOR v_user IN (SELECT id, email, role, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10) LOOP
        
        -- Check if profile exists
        SELECT * INTO v_profile FROM public.profiles WHERE id = v_user.id;
        
        IF v_profile IS NULL THEN
            RAISE NOTICE '⚠️ USUARIO SIN PERFIL: % (ID: %)', v_user.email, v_user.id;
            v_missing_profiles := v_missing_profiles + 1;
        ELSE
            RAISE NOTICE '✅ Usuario: % | Rol Auth: % | Rol Perfil: % | Tenant: %', 
                v_user.email, v_user.role, v_profile.role, v_profile.tenant_id;
                
            IF v_profile.role IS NULL THEN
                 RAISE NOTICE '   ❌ ERROR: El rol en profile es NULL';
                 v_mismatched_roles := v_mismatched_roles + 1;
            END IF;
            
            IF v_profile.tenant_id IS NULL AND v_profile.role NOT IN ('admin', 'service_role') THEN
                 RAISE NOTICE '   ❌ ERROR: El tenant_id es NULL (Requerido para %)', v_profile.role;
            END IF;
        END IF;
        
    END LOOP;

    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'RESUMEN:';
    RAISE NOTICE 'Perfiles Faltantes: %', v_missing_profiles;
    RAISE NOTICE 'Roles/Tenants Inválidos: %', v_mismatched_roles;
    RAISE NOTICE '---------------------------------------------------';
END $$;
