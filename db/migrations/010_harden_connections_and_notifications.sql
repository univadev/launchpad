-- Close two write holes and move notification creation into the database.
-- Run this in the Supabase SQL editor, after 004/007 (needs clerk_user_id()).
--
-- 1. connections_update let the REQUESTER update their own pending request, so
--    anyone could send a request and immediately mark it 'accepted' — unlocking
--    the other person's socials without their consent. Only the recipient may
--    now respond; the requester can still cancel (delete).
--
-- 2. notifications_insert allowed any signed-in user to insert any notification
--    for any user with arbitrary content (spoofed messages, fake connection
--    requests). Notifications are now written only by SECURITY DEFINER triggers
--    on comments / reactions / connections, and the client insert policy is gone.
--    The client-side insert in PostDetail.jsx was removed in the same change.
--
-- Also: comment replies now notify the parent comment's author, upvotes notify
-- the project owner, and 'connection_accepted' carries the accepter's username
-- so the notification can link to their profile.

begin;

create or replace function public.clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

-- ---------------------------------------------------------------------------
-- 1. connections: only the recipient may respond to a request.
-- ---------------------------------------------------------------------------
drop policy if exists connections_update on public.connections;
create policy connections_update on public.connections
  for update using (recipient_id = public.clerk_user_id())
              with check (recipient_id = public.clerk_user_id());

-- ---------------------------------------------------------------------------
-- 2. notifications: no direct inserts from clients.
-- ---------------------------------------------------------------------------
drop policy if exists notifications_insert on public.notifications;

-- Comments: notify the project owner, and on a reply also the parent comment's
-- author. Never notify yourself, and never send the same person two.
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proj record;
  actor record;
  parent_author text;
  payload jsonb;
begin
  select id, title, user_id into proj from public.projects where id = new.project_id;
  if proj.id is null then
    return new;
  end if;

  select full_name, username into actor from public.users where id = new.user_id;

  if new.parent_comment_id is not null then
    select user_id into parent_author from public.comments where id = new.parent_comment_id;
  end if;

  payload := jsonb_build_object(
    'project_id', proj.id,
    'project_title', proj.title,
    'commenter_id', new.user_id,
    'actor_name', actor.full_name,
    'actor_username', actor.username,
    'preview', left(new.content, 100)
  );

  if proj.user_id is distinct from new.user_id then
    insert into public.notifications (user_id, type, content, read)
    values (proj.user_id, 'comment', payload, false);
  end if;

  if parent_author is not null
     and parent_author is distinct from new.user_id
     and parent_author is distinct from proj.user_id then
    insert into public.notifications (user_id, type, content, read)
    values (parent_author, 'comment', payload || jsonb_build_object('is_reply', true), false);
  end if;

  return new;
end
$$;

drop trigger if exists comments_notify on public.comments;
create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Upvotes: notify the project owner once per (project, voter), so toggling the
-- upvote off and on doesn't spam them.
create or replace function public.notify_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proj record;
  actor record;
begin
  select id, title, user_id into proj from public.projects where id = new.project_id;
  if proj.id is null or proj.user_id = new.user_id then
    return new;
  end if;

  if exists (
    select 1 from public.notifications
    where user_id = proj.user_id
      and type = 'reaction'
      and content ->> 'project_id' = proj.id::text
      and content ->> 'actor_id' = new.user_id
  ) then
    return new;
  end if;

  select full_name, username into actor from public.users where id = new.user_id;

  insert into public.notifications (user_id, type, content, read)
  values (
    proj.user_id,
    'reaction',
    jsonb_build_object(
      'project_id', proj.id,
      'project_title', proj.title,
      'actor_id', new.user_id,
      'actor_name', actor.full_name,
      'actor_username', actor.username
    ),
    false
  );
  return new;
end
$$;

drop trigger if exists reactions_notify on public.reactions;
create trigger reactions_notify
  after insert on public.reactions
  for each row execute function public.notify_on_reaction();

-- Connections: same as 001, plus the accepter's name/username on acceptance.
create or replace function public.handle_connection_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
  requester_username text;
  recipient_name text;
  recipient_username text;
begin
  if (tg_op = 'INSERT') then
    select full_name, username
      into requester_name, requester_username
      from public.users where id = new.requester_id;

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
    select full_name, username
      into recipient_name, recipient_username
      from public.users where id = new.recipient_id;

    insert into public.notifications (user_id, type, content, read)
    values (
      new.requester_id,
      'connection_accepted',
      jsonb_build_object(
        'connection_id', new.id,
        'recipient_id', new.recipient_id,
        'recipient_name', recipient_name,
        'recipient_username', recipient_username
      ),
      false
    );
  end if;
  return new;
end
$$;

commit;
