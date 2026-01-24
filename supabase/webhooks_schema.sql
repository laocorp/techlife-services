-- WEBHOOKS AUTOMATION SCHEMA

create table public.webhooks (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  url text not null,
  description text,
  event_type text not null, -- e.g. 'order.status_change', 'order.created', '*'
  secret text, -- For signature verification (optional for MVP)
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.webhooks enable row level security;

create policy "Users can view webhooks in same tenant" on public.webhooks
  for select using (tenant_id = get_current_tenant_id());

create policy "Owners/Admins can manage webhooks" on public.webhooks
  for all using (
    tenant_id = get_current_tenant_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Trigger for updatedAt
create trigger update_webhooks_updated_at before update on public.webhooks
for each row execute procedure update_updated_at_column();
