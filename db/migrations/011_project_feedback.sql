-- Saved AI feedback runs, so feedback survives across sessions and owners can
-- see their readiness score change as they improve a project.
-- Run this in the Supabase SQL editor.
--
-- Private to the project owner. The client writes the row from the response of
-- /api/analyze-project; an owner could forge their own score, but it is only
-- ever shown back to them, so there is nothing to gain.

begin;

create or replace function public.clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create table if not exists public.project_feedback (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     text not null references public.users(id) on update cascade on delete cascade,
  readiness   smallint not null check (readiness between 1 and 5),
  -- Full response: verdict, strengths, gaps, skills, venue_ids, labels.
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists project_feedback_project_idx
  on public.project_feedback (project_id, created_at desc);

alter table public.project_feedback enable row level security;

drop policy if exists project_feedback_select on public.project_feedback;
create policy project_feedback_select on public.project_feedback
  for select using (user_id = public.clerk_user_id());

drop policy if exists project_feedback_insert on public.project_feedback;
create policy project_feedback_insert on public.project_feedback
  for insert with check (
    user_id = public.clerk_user_id()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = public.clerk_user_id()
    )
  );

drop policy if exists project_feedback_delete on public.project_feedback;
create policy project_feedback_delete on public.project_feedback
  for delete using (user_id = public.clerk_user_id());

commit;
