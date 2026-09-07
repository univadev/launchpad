-- Restore account relinking for users migrating from Supabase Auth to Clerk.
--
-- AuthContext.fetchProfile() finds a returning user's old row by email and
-- rewrites its id to their new Clerk id, so their profile, projects and
-- connections follow them. Migration 007 blocks that: the old row's id is a
-- Supabase uuid, not the caller's Clerk id, so users_update rejects it.
--
-- TRADE-OFF, READ BEFORE RUNNING:
-- This policy lets any signed-in Clerk user point a *legacy* (non-Clerk) row at
-- themselves. Row ids are publicly readable, so in principle someone could claim
-- a legacy account that is not theirs. It is far narrower than the pre-007 state
-- (which allowed editing and deleting every row, including Clerk ones), but it is
-- not airtight.
--
-- This is a TEMPORARY bridge. The correct fix is to add
--   "email": "{{user.primary_email_address}}"
-- to the Clerk JWT template, then gate the relink on that verified claim and drop
-- this policy. Remove it once every legacy account has migrated:
--   drop policy if exists users_relink_legacy on public.users;

begin;

create policy users_relink_legacy on public.users
  for update
  using (
    public.clerk_user_id() is not null
    -- Legacy Supabase-Auth rows only. Clerk-owned rows (user_...) stay protected
    -- by users_update and cannot be touched through this policy.
    and id !~ '^user_'
  )
  with check (
    -- The row may only ever be moved TO the caller. It cannot be pointed at
    -- anyone else, and no other column change is possible without also
    -- satisfying this.
    id = public.clerk_user_id()
  );

commit;

select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'users'
order by policyname;
