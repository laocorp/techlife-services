-- =============================================
-- FIX OWNER ACCOUNT (MANUAL LINK)
-- =============================================
-- This script manually connects the specialized user to a new Tenant and Profile.

DO $$
DECLARE
  v_user_email text := 'Danhelic2011paypal@gmail.com'; -- EXACT EMAIL
  v_tenant_name text := 'Taller Principal';
  v_user_id uuid;
  v_tenant_id uuid;
BEGIN
  -- 1. Get the User ID from Auth
  SELECT id INTO v_user_id FROM auth.users WHERE email ILIKE v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Error: No existe el usuario % en Authentication.', v_user_email;
  END IF;

  -- 2. Create Tenant if it doesn't exist
  -- Check if we already have a tenant, otherwise create one.
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

  IF v_tenant_id IS NULL THEN
      INSERT INTO public.tenants (name, slug, subscription_plan) 
      VALUES (v_tenant_name, 'taller-principal', 'enterprise') 
      RETURNING id INTO v_tenant_id;
      RAISE NOTICE '✅ Nuevo Taller creado: % (ID: %)', v_tenant_name, v_tenant_id;
  ELSE
      RAISE NOTICE 'ℹ️ Usando Taller existente (ID: %)', v_tenant_id;
  END IF;

  -- 3. Create or Update Profile
  INSERT INTO public.profiles (id, full_name, role, tenant_id, email)
  VALUES (
    v_user_id, 
    'Dueño del Taller', -- Name
    'owner',            -- Role
    v_tenant_id, 
    v_user_email
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = 'owner',
    tenant_id = v_tenant_id,
    email = EXCLUDED.email;

  RAISE NOTICE '🚀 ¡Listo! El usuario % es ahora DUEÑO del taller.', v_user_email;

END $$;
