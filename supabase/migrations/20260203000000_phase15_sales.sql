-- Phase 15: Sales & Cashier Roles (Corrected for ENUMs v2)

-- 1. Update Roles (Handling ENUM type 'user_role')
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_store';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_field';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cashier';

-- 2. Add Sales Code to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sales_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_sales_code ON public.profiles(tenant_id, sales_code) WHERE sales_code IS NOT NULL;

-- 3. Add Sales Rep to Orders
ALTER TABLE public.service_orders
ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_service_orders_sales_rep ON public.service_orders(sales_rep_id);

-- 4. Make asset_id optional (For Direct Sales)
ALTER TABLE public.service_orders ALTER COLUMN asset_id DROP NOT NULL;

-- 5. Add pending_payment status (Handling ENUM type 'order_status')
-- The error confirmed the enum name is 'order_status'
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_payment';

-- 6. Add Permissions (RLS)
-- (Implicitly handled by App Logic for now)
