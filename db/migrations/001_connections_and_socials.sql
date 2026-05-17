-- Connections + social profile links
-- Run this in the Supabase SQL editor.

-- 1. Add social fields to users
alter table public.users
  add column if not exists linkedin_url text,
  add column if not exists discord_username text,
  add column if not exists github_url text;

-- 2. Connections table (one row per directed request)
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, recipient_id),
  check (requester_id <> recipient_id)
);

create index if not exists connections_requester_idx on public.connections (requester_id);
create index if not exists connections_recipient_idx on public.connections (recipient_id);
create index if not exists connections_status_idx on public.connections (status);

-- 3. RLS
alter table public.connections enable row level security;

-- anyone can read accepted connections (for public counts / mutual visibility checks)
drop policy if exists connections_read on public.connections;
create policy connections_read on public.connections
  for select using (
    status = 'accepted'
    or requester_id = auth.uid()
    or recipient_id = auth.uid()
  );

drop policy if exists connections_insert on public.connections;
create policy connections_insert on public.connections
  for insert with check (requester_id = auth.uid());

drop policy if exists connections_update on public.connections;
create policy connections_update on public.connections
  for update using (
    recipient_id = auth.uid() or requester_id = auth.uid()
  );

drop policy if exists connections_delete on public.connections;
create policy connections_delete on public.connections
  for delete using (
    requester_id = auth.uid() or recipient_id = auth.uid()
  );

-- 4. Allow connection notification types on the notifications table
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('reaction', 'comment', 'mention', 'connection_request', 'connection_accepted'));

-- 5. Notify recipient when a connection request is created or accepted
create or replace function public.handle_connection_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
  requester_username text;
begin
  select full_name, username
    into requester_name, requester_username
    from public.users where id = new.requester_id;

  if (tg_op = 'INSERT') then
    insert into public.notifications (user_id, type, content, read)
    values (
      new.recipient_id,
      'connection_request',
      jsonb_build_object(
        'connection_id', new.id,
        'requester_id', new.requester_id,
        'requester_name', requester_name,
        'requester_username', requester_username
      ),
      false
    );
  elsif (tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted') then
    -- notify the original requester that their request was accepted
    insert into public.notifications (user_id, type, content, read)
    values (
      new.requester_id,
      'connection_accepted',
      jsonb_build_object(
        'connection_id', new.id,
        'recipient_id', new.recipient_id
      ),
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists connection_notify_insert on public.connections;
create trigger connection_notify_insert
  after insert on public.connections
  for each row execute function public.handle_connection_notification();

drop trigger if exists connection_notify_update on public.connections;
create trigger connection_notify_update
  after update on public.connections
  for each row execute function public.handle_connection_notification();
