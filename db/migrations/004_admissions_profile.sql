
alter table public.users
  add column if not exists admissions_profile jsonb not null default '{}'::jsonb;
