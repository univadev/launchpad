-- Internship applications
-- Run this in the Supabase SQL editor.
--
-- NOTE: user_id is TEXT, not uuid. Migration 003 converted public.users.id to
-- text to hold Clerk ids (e.g. "user_2abc..."), so a uuid FK cannot be created
-- here. RLS compares against public.clerk_user_id() for the same reason: this
-- project authenticates with Clerk, so Supabase's own auth helper is always
-- NULL here and would block every insert.

-- Recreated defensively in case 004 has not been applied to this database.
create or replace function public.clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create table if not exists public.applications (
  id               uuid primary key default gen_random_uuid(),
  internship_id    text not null,
  user_id          text references public.users(id) on delete cascade not null,

  -- Personal information
  first_name       text not null,
  last_name        text not null,
  email            text not null,
  phone            text not null,
  date_of_birth    date not null,
  grade_year       text not null,
  school_name      text not null,
  graduation_year  integer not null,
  city             text not null,
  state_region     text not null,
  country          text not null,

  -- Academic information
  gpa              numeric(3,2) not null,
  class_rank       text,
  transcript_url   text not null,

  -- Activities and skills
  activities_url   text not null,
  skills           text[] not null,
  skills_details   text,

  -- Links
  linkedin_url     text,
  portfolio_url    text,

  -- Text response questions
  underrepresented_response text not null,
  program_motivation        text not null,

  -- Quick takes
  favorite_tech    text not null,
  tech_problem     text not null,
  career_goal      text not null,
  inspiration      text not null,

  -- Statement
  why_interested   text not null,

  -- Meta
  status           text default 'pending' not null,
  created_at       timestamptz default now() not null,

  unique(internship_id, user_id)
);

create index if not exists applications_user_id_idx       on public.applications (user_id);
create index if not exists applications_internship_id_idx on public.applications (internship_id);
create index if not exists applications_status_idx        on public.applications (status);

alter table public.applications enable row level security;

drop policy if exists users_insert_own_applications on public.applications;
create policy users_insert_own_applications on public.applications
  for insert
  with check (user_id = public.clerk_user_id());

drop policy if exists users_read_own_applications on public.applications;
create policy users_read_own_applications on public.applications
  for select
  using (user_id = public.clerk_user_id());
