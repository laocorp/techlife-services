-- Webhooks Schema
-- Date: 2026-01-27
-- Author: Antigravity

-- 1. Webhooks Configuration Table
create table if not exists public.webhooks (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone default now(),
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    
    name text not null, -- e.g. "WhatsApp Notification"
    url text not null, -- External API URL
    event_type text not null, -- e.g. "order.completed", "payment.received", "all"
    is_active boolean default true,
    secret text, -- Optional signing secret
    
    constraint webhooks_url_check check (url ~* '^https?://.*')
);

-- RLS for Webhooks
alter table public.webhooks enable row level security;

create policy "Tenants can manage their own webhooks"
on public.webhooks
using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

-- 2. Webhook Delivery Logs (Optional but implementing for debugging)
create table if not exists public.webhook_logs (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone default now(),
    webhook_id uuid references public.webhooks(id) on delete cascade not null,
    
    event_type text not null,
    payload jsonb,
    response_status integer,
    response_body text,
    success boolean default false
);

-- RLS for Logs
alter table public.webhook_logs enable row level security;

create policy "Tenants can view their own webhook logs"
on public.webhook_logs
using (webhook_id in (select id from public.webhooks));

-- Indexes
create index if not exists idx_webhooks_tenant on public.webhooks(tenant_id);
create index if not exists idx_webhook_logs_webhook on public.webhook_logs(webhook_id);
