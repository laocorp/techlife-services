-- Phase 14: Advanced Roles & Multi-Branch Architecture

-- 1. Create Branches Table
create table if not exists public.branches (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    name text not null,
    address text,
    phone text,
    is_main boolean default false,
    created_at timestamptz default now()
);

alter table public.branches enable row level security;
create policy "Tenants can manage their branches" on public.branches using (tenant_id in (select tenant_id from profiles where id = auth.uid()));

-- 2. Create Warehouses Table
create table if not exists public.warehouses (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null, -- Can be null for global/main warehouse? Or enforce branch.
    name text not null,
    created_at timestamptz default now()
);

alter table public.warehouses enable row level security;
create policy "Tenants can manage their warehouses" on public.warehouses using (tenant_id in (select tenant_id from profiles where id = auth.uid()));

-- 3. Update Profiles for Roles & Branch
-- We need to add the new values to the existing ENUM type 'user_role'
-- PostgreSQL allows adding values to enums. API cannot do "IF NOT EXISTS" cleanly in one line for enums in old versions, 
-- but 'ALTER TYPE ... ADD VALUE IF NOT EXISTS' is supported in generic SQL blocks in newer PG.
-- If 'IF NOT EXISTS' is not supported by your generic runner, we wrap in DO block.

DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'head_technician';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'technician'; -- Ensure existing ones are there? technician likely exists
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'receptionist';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'warehouse_keeper';
EXCEPTION
    WHEN duplicate_object THEN null; -- Ignore if already exists
END $$;

-- Add branch_id column
alter table public.profiles add column if not exists branch_id uuid references public.branches(id) on delete set null;

-- 4. Scope Service Orders to Branch
alter table public.service_orders add column if not exists branch_id uuid references public.branches(id) on delete set null;

-- 5. Multi-Warehouse Stock
create table if not exists public.inventory_stock (
    id uuid default gen_random_uuid() primary key,
    item_id uuid references public.products(id) on delete cascade not null,
    warehouse_id uuid references public.warehouses(id) on delete cascade not null,
    quantity numeric default 0,
    min_stock numeric default 0,
    location_in_warehouse text, -- Shelf A, Bin 2
    updated_at timestamptz default now(),
    unique(item_id, warehouse_id)
);

alter table public.inventory_stock enable row level security;
create policy "Tenants can view stock" on public.inventory_stock using (
    exists (select 1 from public.products i where i.id = inventory_stock.item_id and i.tenant_id in (select tenant_id from profiles where id = auth.uid()))
);
-- Allow modification only by staff with proper roles? For now open to tenant staff.
create policy "Tenants can manage stock" on public.inventory_stock using (
    exists (select 1 from public.products i where i.id = inventory_stock.item_id and i.tenant_id in (select tenant_id from profiles where id = auth.uid()))
);


-- 6. Audit Logs (Bitácora)
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    actor_id uuid references auth.users(id),
    action text not null, -- 'create_order', 'update_stock', 'login'
    resource text, -- 'service_orders', 'inventory'
    resource_id uuid,
    details jsonb,
    created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

-- Only Owner (and maybe Manager) can VIEW logs.
create policy "Owners view audit logs" on public.audit_logs for select using (
    tenant_id in (select tenant_id from profiles where id = auth.uid() and role = 'owner')
);

-- Everyone can INSERT logs (system triggers this, or RLS allows user to log their own actions)
-- Ideally this is handled by database triggers or secure functions, but for App-level logging:
create policy "Staff insert audit logs" on public.audit_logs for insert with check (
    tenant_id in (select tenant_id from profiles where id = auth.uid())
);


-- 7. DATA MIGRATION DO BLOCK
-- Automatically create a Main Branch and Main Warehouse for existing tenants
do $$
declare
    t record;
    main_branch_id uuid;
    main_warehouse_id uuid;
begin
    for t in select * from public.tenants loop
        -- Check if branch exists
        select id into main_branch_id from public.branches where tenant_id = t.id and is_main = true limit 1;
        
        if main_branch_id is null then
            insert into public.branches (tenant_id, name, is_main, address)
            values (t.id, 'Sede Principal', true, 'Dirección Principal')
            returning id into main_branch_id;
        end if;

        -- Check if warehouse exists
        select id into main_warehouse_id from public.warehouses where tenant_id = t.id and name = 'Bodega Principal' limit 1;
        
        if main_warehouse_id is null then
            insert into public.warehouses (tenant_id, branch_id, name)
            values (t.id, main_branch_id, 'Bodega Principal')
            returning id into main_warehouse_id;
        end if;

        -- Migrate Profiles
        -- Assign all existing staff to the main branch
        update public.profiles set branch_id = main_branch_id where tenant_id = t.id and branch_id is null;

        -- Migrate Service Orders
        update public.service_orders set branch_id = main_branch_id where tenant_id = t.id and branch_id is null;

        -- Migrate Stock
        -- For each item in this tenant, create a stock entry in the main warehouse using the legacy 'quantity' field
        -- Note: We rely on 'products' having a 'quantity' column.
        -- We insert only if stock doesn't exist yet.
        insert into public.inventory_stock (item_id, warehouse_id, quantity)
        select id, main_warehouse_id, quantity 
        from public.products
        where tenant_id = t.id
        on conflict (item_id, warehouse_id) do nothing;
        
    end loop;
end $$;
