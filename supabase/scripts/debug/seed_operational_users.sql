-- Create Test Users for Operational Roles
-- Password for all: "password123"

DO $$
DECLARE
  v_tenant_id uuid;
  v_tech_id uuid := '00000000-0000-0000-0000-000000000003';
  v_warehouse_id uuid := '00000000-0000-0000-0000-000000000004';
  v_reception_id uuid := '00000000-0000-0000-0000-000000000005';
  v_head_tech_id uuid := '00000000-0000-0000-0000-000000000006';
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

  -- 1. TECHNICIAN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tecnico@test.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES 
      (v_tech_id, '00000000-0000-0000-0000-000000000000', 'tecnico@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Técnico"}', 'authenticated', 'authenticated');
  END IF;
  
  INSERT INTO public.profiles (id, full_name, role, tenant_id)
  VALUES (v_tech_id, 'Test Técnico', 'technician', v_tenant_id)
  ON CONFLICT (id) DO UPDATE SET role = 'technician', tenant_id = v_tenant_id;

  -- 2. WAREHOUSE KEEPER
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'bodega@test.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES 
      (v_warehouse_id, '00000000-0000-0000-0000-000000000000', 'bodega@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Bodega"}', 'authenticated', 'authenticated');
  END IF;

  INSERT INTO public.profiles (id, full_name, role, tenant_id)
  VALUES (v_warehouse_id, 'Test Bodega', 'warehouse_keeper', v_tenant_id)
  ON CONFLICT (id) DO UPDATE SET role = 'warehouse_keeper', tenant_id = v_tenant_id;

  -- 3. RECEPTIONIST
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'recepcion@test.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES 
      (v_reception_id, '00000000-0000-0000-0000-000000000000', 'recepcion@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Recepción"}', 'authenticated', 'authenticated');
  END IF;

  INSERT INTO public.profiles (id, full_name, role, tenant_id)
  VALUES (v_reception_id, 'Test Recepción', 'receptionist', v_tenant_id)
  ON CONFLICT (id) DO UPDATE SET role = 'receptionist', tenant_id = v_tenant_id;
  
  -- 4. HEAD TECHNICIAN (Jefe de Taller)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jefetaller@test.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES 
      (v_head_tech_id, '00000000-0000-0000-0000-000000000000', 'jefetaller@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Jefe Taller"}', 'authenticated', 'authenticated');
  END IF;

  INSERT INTO public.profiles (id, full_name, role, tenant_id)
  VALUES (v_head_tech_id, 'Test Jefe Taller', 'head_technician', v_tenant_id)
  ON CONFLICT (id) DO UPDATE SET role = 'head_technician', tenant_id = v_tenant_id;

END $$;
