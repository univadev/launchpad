-- Close the public write hole on public.users.
--
-- Migration 005 dropped every policy on users and replaced them with:
--   create policy users_all_access on public.users for all to public
--     using (true) with check (true);
-- The Supabase publishable key ships inside the frontend JS bundle, so that policy
-- lets ANY visitor read every user's email and update or delete any row.
--
-- PREREQUISITE: the Clerk -> Supabase integration must be active, so that
-- auth.jwt() ->> 'sub' resolves to the caller's Clerk id. If it does not, every
-- write below is rejected and the app breaks. Verify BEFORE running this.
--
-- ROLLBACK (paste this if writes start failing):
--   drop policy if exists users_select on public.users;
--   drop policy if exists users_insert on public.users;
--   drop policy if exists users_update on public.users;
--   drop policy if exists users_delete on public.users;
--   create policy users_all_access on public.users for all to public
--     using (true) with check (true);

begin;

-- The caller's Clerk id, or NULL when anonymous. Recreated defensively.
create or replace function public.clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

alter table public.users enable row level security;

-- Remove every existing policy on users so the open one cannot survive and
-- keep granting access (Postgres ORs permissive policies together).
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'users'
  loop
    execute format('drop policy if exists %I on public.users', r.policyname);
  end loop;
end $$;

-- Profiles stay publicly readable: Discover, public profile pages and project
-- author cards all read other users' rows, including for logged-out visitors.
-- (See the note below about email exposure.)
create policy users_select on public.users
  for select using (true);

-- Writes are restricted to the row you actually are.
create policy users_insert on public.users
  for insert with check (id = public.clerk_user_id());

create policy users_update on public.users
  for update using (id = public.clerk_user_id())
              with check (id = public.clerk_user_id());

create policy users_delete on public.users
  for delete using (id = public.clerk_user_id());

commit;

-- Verify: expect 4 rows (select/insert/update/delete) and NO users_all_access.
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'users'
order by policyname;
