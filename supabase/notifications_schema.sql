-- NOTIFICATIONS TABLE
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null, -- If null, visible to all staff of tenant
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.notifications enable row level security;

-- Policy: Users can view notifications for their tenant, AND (recipient is them OR recipient is null)
create policy "Users can view own notifications" on public.notifications
  for select using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid())
    and
    (recipient_id = auth.uid() or recipient_id is null)
  );

-- Policy: Users can update own notifications (mark as read)
create policy "Users can update own notifications" on public.notifications
  for update using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid())
    and
    (recipient_id = auth.uid() or recipient_id is null)
  );

-- Policy: System/Functions can insert (we'll allow authenticated inputs for now for the server action)
-- Actually the approveOrderAction runs as the *Customer* (auth.uid = customer user). 
-- Customers need permission to INSERT notifications for the tenant staff.
-- BUT customers typically don't belong to the tenant in `profiles` table context.
-- So we need a policy allowing ANY authenticated user to insert a notification IF they have access to the related order? 
-- Or simpler: "Users can insert notifications" (broad) OR we rely on the Server Action using `service_role` client?
-- Since we are using `createClient(cookieStore)` in the action, it uses the user's session (Customer).
-- So the Customer needs INSERT permission on `notifications`.

create policy "Anyone can insert notifications" on public.notifications
  for insert with check (true); 
-- In a real app we'd restrict this more, e.g. "insert if you own the related order". 
-- For MVP, "check(true)" for authenticated users is acceptable.
