-- Teammate matching: projects can say which roles they're looking for, and
-- other students can raise their hand.
-- Run this in the Supabase SQL editor, after 010.

begin;

alter table public.projects
  add column if not exists looking_for text[] not null default '{}';

create index if not exists projects_looking_for_idx
  on public.projects using gin (looking_for);

-- Allow the new notification type (constraint first created in 001).
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('reaction', 'comment', 'mention', 'connection_request',
                  'connection_accepted', 'collab_interest'));

-- Clients can't insert notifications directly (010), so interest goes through
-- this function. It checks the role is one the project actually asked for,
-- stops owners pinging themselves, and only lets each student raise their
-- hand once per project.
create or replace function public.express_collab_interest(
  p_project_id uuid,
  p_role text,
  p_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me text := public.clerk_user_id();
  proj record;
  actor record;
begin
  if me is null then
    raise exception 'Sign in first';
  end if;

  select id, title, user_id, looking_for into proj
    from public.projects where id = p_project_id;
  if proj.id is null then
    raise exception 'Project not found';
  end if;
  if proj.user_id = me then
    raise exception 'This is your own project';
  end if;
  if not (p_role = any (proj.looking_for)) then
    raise exception 'This project is not looking for that role';
  end if;

  if exists (
    select 1 from public.notifications
    where user_id = proj.user_id
      and type = 'collab_interest'
      and content ->> 'project_id' = proj.id::text
      and content ->> 'actor_id' = me
  ) then
    raise exception 'You already told them you''re interested';
  end if;

  select full_name, username into actor from public.users where id = me;

  insert into public.notifications (user_id, type, content, read)
  values (
    proj.user_id,
    'collab_interest',
    jsonb_build_object(
      'project_id', proj.id,
      'project_title', proj.title,
      'role', p_role,
      'message', left(nullif(trim(p_message), ''), 300),
      'actor_id', me,
      'actor_name', actor.full_name,
      'actor_username', actor.username
    ),
    false
  );
end
$$;

revoke all on function public.express_collab_interest(uuid, text, text) from public;
grant execute on function public.express_collab_interest(uuid, text, text) to authenticated;

commit;
