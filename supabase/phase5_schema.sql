-- PHASE 5: Consumer Ecosystem & Marketplace

-- 1. Updates to Tenants (Marketplace Metadata)
alter table public.tenants
add column if not exists is_public boolean default false,
add column if not exists description text,
add column if not exists public_address text,
add column if not exists logo_url text,
add column if not exists contact_email text,
add column if not exists contact_phone text;

-- Index for marketplace searching
create index if not exists idx_tenants_is_public on public.tenants(is_public);
create index if not exists idx_tenants_industry on public.tenants(industry);

-- 2. Global User Assets (My Garage)
-- These are assets owned by the USER, not bound to a specific tenant.
create table if not exists public.user_assets (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type industry_type not null default 'automotive',
    identifier text not null, -- Placa, Serial, IMEI
    alias text, -- "Mi Ferrari", "Laptop Trabajo"
    details jsonb default '{}'::jsonb, -- Make, Model, Year, Color
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS for User Assets
alter table public.user_assets enable row level security;

create policy "Users can manage own global assets" on public.user_assets
    for all using (auth.uid() = user_id);

-- 3. Personal Maintenance Logs (Bitacora Personal)
-- Records of service done outside the SaaS ecosystem or manually logged.
create table if not exists public.personal_maintenance_logs (
    id uuid primary key default uuid_generate_v4(),
    user_asset_id uuid not null references public.user_assets(id) on delete cascade,
    provider_name text not null, -- "Taller Juan", "Self-Service", "Official Dealer"
    service_date date not null default current_date,
    description text not null, -- "Oil Change", "Screen Replacement"
    cost decimal(10, 2),
    notes text,
    created_at timestamptz default now()
);

-- RLS for Logs
alter table public.personal_maintenance_logs enable row level security;

create policy "Users can manage own logs" on public.personal_maintenance_logs
    for all using (
        exists (
            select 1 from public.user_assets
            where id = personal_maintenance_logs.user_asset_id
            and user_id = auth.uid()
        )
    );

-- 4. Trigger for timestamp
create trigger update_user_assets_updated_at before update on public.user_assets
for each row execute procedure update_updated_at_column();
