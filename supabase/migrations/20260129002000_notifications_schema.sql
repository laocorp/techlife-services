-- Notifications Table (Clean Slate)
drop table if exists public.notifications cascade;

create table public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    title text not null,
    message text not null,
    type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
    read boolean default false,
    link text,
    created_at timestamptz default now()
);

-- RLS
alter table public.notifications enable row level security;

-- 1. View own notifications
create policy "Users can view own notifications"
on public.notifications for select
to authenticated
using (auth.uid() = user_id);

-- 2. Update own (mark as read)
create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using (auth.uid() = user_id);

-- 3. Insert (Any authenticated user can send a notification, e.g. Workshop -> Client)
create policy "Authenticated can insert notifications"
on public.notifications for insert
to authenticated
with check (true); 

-- Enable Realtime
-- Try/Catch approach for publication in case it's already added or missing
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then
  null; -- Ignore if already added or publication missing
end;
$$;
