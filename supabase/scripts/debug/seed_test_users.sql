-- Create Test Users for Role Validation (Corrected Syntax for Conflict)
-- Password for all: "password123"

-- Ensure we have a tenant
DO $$
DECLARE
  v_tenant_id uuid;
  v_sales_id uuid := '00000000-0000-0000-0000-000000000001';
  v_cashier_id uuid := '00000000-0000-0000-0000-000000000002';
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

  -- 1. Create Vendedor (Salesperson) if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vendedor@test.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES 
      (v_sales_id, '00000000-0000-0000-0000-000000000000', 'vendedor@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Vendedor"}', 'authenticated', 'authenticated');
  END IF;

  -- Update Profile for Vendedor
  INSERT INTO public.profiles (id, email, first_name, last_name, role, tenant_id)
  VALUES (v_sales_id, 'vendedor@test.com', 'Test', 'Vendedor', 'sales_store', v_tenant_id)
  ON CONFLICT (id) DO UPDATE SET role = 'sales_store', tenant_id = v_tenant_id;


  -- 2. Create Cajero (Cashier) if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cajero@test.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES 
      (v_cashier_id, '00000000-0000-0000-0000-000000000000', 'cajero@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Cajero"}', 'authenticated', 'authenticated');
  END IF;

  -- Update Profile for Cajero
  INSERT INTO public.profiles (id, email, first_name, last_name, role, tenant_id)
  VALUES (v_cashier_id, 'cajero@test.com', 'Test', 'Cajero', 'cashier', v_tenant_id)
  ON CONFLICT (id) DO UPDATE SET role = 'cashier', tenant_id = v_tenant_id;

END $$;
