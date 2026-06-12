-- Project views tracking
-- Run this in the Supabase SQL editor.

create table if not exists public.project_views (
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id    uuid references public.users(id) on delete set null,
  viewed_at  timestamptz default now() not null
);

create index if not exists project_views_project_id_idx on public.project_views (project_id);
create index if not exists project_views_user_id_idx on public.project_views (user_id);

alter table public.project_views enable row level security;

drop policy if exists insert_views on public.project_views;
create policy insert_views on public.project_views
  for insert with check (true);

drop policy if exists read_views on public.project_views;
create policy read_views on public.project_views
  for select using (true);
