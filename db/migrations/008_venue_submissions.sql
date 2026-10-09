-- Submission tracker: where a student is taking each project.
-- Run this in the Supabase SQL editor.
--
-- venue_id is a key into the hand-maintained catalog in src/lib/venues.js, not a
-- foreign key — the catalog lives in code so the AI can only recommend real venues.
--
-- user_id is TEXT (Clerk id), same as every other ownership column since 003.
-- RLS compares against public.clerk_user_id() for the same reason.

begin;

-- Recreated defensively in case 004 has not been applied to this database.
create or replace function public.clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create table if not exists public.venue_submissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references public.users(id) on update cascade on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  venue_id    text not null,

  status      text not null default 'planning'
              check (status in ('planning', 'submitted', 'accepted', 'award', 'rejected')),
  deadline    date,
  -- Free text for the result, e.g. "2nd place, regional round".
  result_note text check (char_length(result_note) <= 200),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (project_id, venue_id)
);

create index if not exists venue_submissions_user_id_idx  on public.venue_submissions (user_id);
create index if not exists venue_submissions_deadline_idx on public.venue_submissions (deadline)
  where status = 'planning';

create or replace function public.venue_submissions_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists venue_submissions_touch on public.venue_submissions;
create trigger venue_submissions_touch
  before update on public.venue_submissions
  for each row execute function public.venue_submissions_touch();

alter table public.venue_submissions enable row level security;

-- Owners see everything they track. Everyone else (including logged-out
-- visitors) sees only results, so profiles can show wins without exposing plans.
drop policy if exists venue_submissions_select on public.venue_submissions;
create policy venue_submissions_select on public.venue_submissions
  for select using (
    user_id = public.clerk_user_id()
    or status in ('accepted', 'award')
  );

-- Writes: only your own rows, and only for projects you own.
drop policy if exists venue_submissions_insert on public.venue_submissions;
create policy venue_submissions_insert on public.venue_submissions
  for insert with check (
    user_id = public.clerk_user_id()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = public.clerk_user_id()
    )
  );

drop policy if exists venue_submissions_update on public.venue_submissions;
create policy venue_submissions_update on public.venue_submissions
  for update using (user_id = public.clerk_user_id())
              with check (user_id = public.clerk_user_id());

drop policy if exists venue_submissions_delete on public.venue_submissions;
create policy venue_submissions_delete on public.venue_submissions
  for delete using (user_id = public.clerk_user_id());

commit;
