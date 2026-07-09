-- Restore real Row Level Security, keyed on the Clerk user id.
-- Run this in the Supabase SQL editor.
--
-- Prerequisite: enable the Clerk <> Supabase integration so that the Clerk
-- session token reaches Postgres with `role: authenticated` and `sub: <clerk id>`.
-- (Supabase Dashboard → Authentication → Third-party Auth → add Clerk.)
-- The client passes that token via the `accessToken` option in src/lib/supabase.js.
--
-- This migration replaces the blanket `using (true) with check (true)` policies
-- from 003_clerk_minimal_fix.sql, which left every table world-writable through
-- the public anon key. Ownership columns are text (Clerk ids are not UUIDs), so
-- we compare against auth.jwt()->>'sub' directly rather than auth.uid(), which
-- casts to uuid and would error on a Clerk id.

begin;

-- Helper: the authenticated caller's Clerk id, or NULL when anonymous.
create or replace function public.clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

-- Drop the permissive catch-all policies created by 003.
do $$
declare r record;
begin
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('users','projects','reactions','comments','notifications','connections','project_views')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Make sure RLS is on for every table we touch.
do $$
declare t text;
begin
  foreach t in array array['users','projects','reactions','comments','notifications','connections','project_views'] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- users: profiles are public to read; you may only write your own row.
-- (Closes the onboarding spoofing hole — id is pinned to the caller's sub.)
-- ---------------------------------------------------------------------------
create policy users_select on public.users
  for select using (true);
create policy users_insert on public.users
  for insert with check (id = public.clerk_user_id());
create policy users_update on public.users
  for update using (id = public.clerk_user_id())
              with check (id = public.clerk_user_id());
create policy users_delete on public.users
  for delete using (id = public.clerk_user_id());

-- ---------------------------------------------------------------------------
-- projects: public read; owner-only write.
-- ---------------------------------------------------------------------------
create policy projects_select on public.projects
  for select using (true);
create policy projects_insert on public.projects
  for insert with check (user_id = public.clerk_user_id());
create policy projects_update on public.projects
  for update using (user_id = public.clerk_user_id())
              with check (user_id = public.clerk_user_id());
create policy projects_delete on public.projects
  for delete using (user_id = public.clerk_user_id());

-- ---------------------------------------------------------------------------
-- reactions: public read (for counts); owner-only write.
-- ---------------------------------------------------------------------------
create policy reactions_select on public.reactions
  for select using (true);
create policy reactions_insert on public.reactions
  for insert with check (user_id = public.clerk_user_id());
create policy reactions_update on public.reactions
  for update using (user_id = public.clerk_user_id())
              with check (user_id = public.clerk_user_id());
create policy reactions_delete on public.reactions
  for delete using (user_id = public.clerk_user_id());

-- ---------------------------------------------------------------------------
-- comments: public read; owner-only write.
-- ---------------------------------------------------------------------------
create policy comments_select on public.comments
  for select using (true);
create policy comments_insert on public.comments
  for insert with check (user_id = public.clerk_user_id());
create policy comments_update on public.comments
  for update using (user_id = public.clerk_user_id())
              with check (user_id = public.clerk_user_id());
create policy comments_delete on public.comments
  for delete using (user_id = public.clerk_user_id());

-- ---------------------------------------------------------------------------
-- notifications: you can only read/modify your own. Any authenticated user may
-- insert one (the actor creates a notification addressed to the recipient, e.g.
-- on a comment — see PostDetail.jsx). Reading others' notifications is blocked.
-- ---------------------------------------------------------------------------
create policy notifications_select on public.notifications
  for select using (user_id = public.clerk_user_id());
create policy notifications_insert on public.notifications
  for insert with check (public.clerk_user_id() is not null);
create policy notifications_update on public.notifications
  for update using (user_id = public.clerk_user_id())
              with check (user_id = public.clerk_user_id());
create policy notifications_delete on public.notifications
  for delete using (user_id = public.clerk_user_id());

-- ---------------------------------------------------------------------------
-- connections: visible to either party (or once accepted); requester-only
-- insert; either party may update (accept/decline) or delete.
-- ---------------------------------------------------------------------------
create policy connections_select on public.connections
  for select using (
    status = 'accepted'
    or requester_id = public.clerk_user_id()
    or recipient_id = public.clerk_user_id()
  );
create policy connections_insert on public.connections
  for insert with check (requester_id = public.clerk_user_id());
create policy connections_update on public.connections
  for update using (
    requester_id = public.clerk_user_id()
    or recipient_id = public.clerk_user_id()
  );
create policy connections_delete on public.connections
  for delete using (
    requester_id = public.clerk_user_id()
    or recipient_id = public.clerk_user_id()
  );

-- ---------------------------------------------------------------------------
-- project_views: public read (for view counts). Anyone (incl. anonymous) may
-- record a view, but may not attribute it to a user other than themselves.
-- ---------------------------------------------------------------------------
create policy project_views_select on public.project_views
  for select using (true);
create policy project_views_insert on public.project_views
  for insert with check (
    user_id is null or user_id = public.clerk_user_id()
  );

commit;
