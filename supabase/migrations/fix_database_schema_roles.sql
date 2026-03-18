-- =============================================
-- FIX DATABASE SCHEMA, ROLES & PERMISSIONS
-- =============================================

-- 1. Ensure Enum Values Exist (Safe Add)
DO $$
BEGIN
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'warehouse_keeper';
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'receptionist';
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'head_technician';
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'technician';
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'sales_store';
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'sales_field';
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'cashier';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Verify Profiles Table Structure
-- Ensure email column exists (Crucial for login/RLS)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'technician';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id);

-- 3. Fix Permissions (Crucial for "Error querying schema")
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Enable RLS & Add Basic Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow admins/owners to view all profiles
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
CREATE POLICY "Owners can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'manager', 'admin')
        )
    );

-- 5. RE-SEED OPERATIONAL USERS
DO $$
DECLARE
  v_tenant_id uuid;
  v_tech_id uuid := '00000000-0000-0000-0000-000000000003';
  v_warehouse_id uuid := '00000000-0000-0000-0000-000000000004';
  v_reception_id uuid := '00000000-0000-0000-0000-000000000005';
  v_head_tech_id uuid := '00000000-0000-0000-0000-000000000006';
BEGIN
  -- Get the first tenant (Assuming it exists, otherwise creates one)
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
     INSERT INTO public.tenants (name, slug) VALUES ('Taller Demo', 'taller-demo') RETURNING id INTO v_tenant_id;
  END IF;

  -- 1. TECHNICIAN
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES 
    (v_tech_id, '00000000-0000-0000-0000-000000000000', 'tecnico@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Técnico"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('password123', gen_salt('bf'));

  INSERT INTO public.profiles (id, full_name, role, tenant_id, email)
  VALUES (v_tech_id, 'Test Técnico', 'technician', v_tenant_id, 'tecnico@test.com')
  ON CONFLICT (id) DO UPDATE SET role = 'technician', tenant_id = v_tenant_id, email = 'tecnico@test.com';

  -- 2. WAREHOUSE KEEPER
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES 
    (v_warehouse_id, '00000000-0000-0000-0000-000000000000', 'bodega@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Bodega"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('password123', gen_salt('bf'));

  INSERT INTO public.profiles (id, full_name, role, tenant_id, email)
  VALUES (v_warehouse_id, 'Test Bodega', 'warehouse_keeper', v_tenant_id, 'bodega@test.com')
  ON CONFLICT (id) DO UPDATE SET role = 'warehouse_keeper', tenant_id = v_tenant_id, email = 'bodega@test.com';

  -- 3. RECEPTIONIST
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES 
    (v_reception_id, '00000000-0000-0000-0000-000000000000', 'recepcion@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Recepción"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('password123', gen_salt('bf'));

  INSERT INTO public.profiles (id, full_name, role, tenant_id, email)
  VALUES (v_reception_id, 'Test Recepción', 'receptionist', v_tenant_id, 'recepcion@test.com')
  ON CONFLICT (id) DO UPDATE SET role = 'receptionist', tenant_id = v_tenant_id, email = 'recepcion@test.com';
  
  -- 4. HEAD TECHNICIAN
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES 
    (v_head_tech_id, '00000000-0000-0000-0000-000000000000', 'jefetaller@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Jefe Taller"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('password123', gen_salt('bf'));

  INSERT INTO public.profiles (id, full_name, role, tenant_id, email)
  VALUES (v_head_tech_id, 'Test Jefe Taller', 'head_technician', v_tenant_id, 'jefetaller@test.com')
  ON CONFLICT (id) DO UPDATE SET role = 'head_technician', tenant_id = v_tenant_id, email = 'jefetaller@test.com';

END $$;
