-- Fix Cashier Role (caja01@gmail.com)
-- This assumes standard auth.users and public.profiles schema (with full_name)
DO $$
DECLARE
  v_target_email text := 'caja01@gmail.com'; 
  v_user_id uuid;
  v_tenant_id uuid;
  v_branch_id uuid;
BEGIN
  -- 1. Find User ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'USER NOT FOUND: %', v_target_email;
    RETURN;
  END IF;

  -- 2. Find Tenant and Branch (Assuming first one)
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
  SELECT id INTO v_branch_id FROM public.branches WHERE tenant_id = v_tenant_id LIMIT 1;

  -- 3. Update Auth Metadata (role: cashier)
  UPDATE auth.users
  SET role = 'authenticated',
      raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"cashier"'),
      raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"cashier"')
  WHERE id = v_user_id;

  -- 4. Update Profile (role: cashier, tenant_id: tenant, branch_id: branch)
  UPDATE public.profiles
  SET role = 'cashier',
      tenant_id = v_tenant_id,
      branch_id = v_branch_id
  WHERE id = v_user_id;

  RAISE NOTICE 'SUCCESS: Updated user % to CASHIER (role: cashier, tenant: %, branch: %)', v_target_email, v_tenant_id, v_branch_id;
END $$;
