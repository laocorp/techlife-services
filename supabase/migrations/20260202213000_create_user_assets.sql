-- Create user_assets table for End Users ("Mi Garaje")
create table if not exists public.user_assets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    identifier text not null, -- Placa, IMEI, etc.
    details jsonb default '{}'::jsonb, -- Brand, Model, Color, etc.
    alias text, -- "Mi auto rojo"
    type text default 'automotive', -- automotive, electronics, etc.
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.user_assets enable row level security;

-- Policies for End Users (Self-management)
create policy "Users can manage their own assets"
    on public.user_assets
    for all
    using (auth.uid() = user_id);

-- Policies for Connected Tenants (Shared Visibility)
-- Tenants can View assets of users who have ACCEPTED a connection with them.
create policy "Connected tenants can view user assets"
    on public.user_assets
    for select
    using (
        exists (
            select 1 from public.tenant_connections tc
            join public.profiles p on p.tenant_id = tc.tenant_id
            where tc.user_id = public.user_assets.user_id
            and tc.status = 'accepted'
            and p.id = auth.uid() -- The person querying is a staff member of that tenant
        )
    );
