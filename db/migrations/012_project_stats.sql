-- Batched counters for project lists.
-- Run this in the Supabase SQL editor.
--
-- Feed, Discover and Profile used to fire 4 queries per project card (40 per
-- page of 10). project_stats() returns every count for a list of projects in
-- one call. It runs as the caller (SECURITY INVOKER), so RLS still applies;
-- reactions, comments and project_views are all publicly readable.
--
-- src/lib/projectStats.js falls back to per-project counts if this function
-- is missing, so the app keeps working before the migration is applied.

create or replace function public.project_stats(ids uuid[])
returns table (project_id uuid, upvotes bigint, comments bigint, views bigint)
language sql
stable
as $$
  select
    p.id,
    (select count(*) from public.reactions r where r.project_id = p.id),
    (select count(*) from public.comments c where c.project_id = p.id),
    (select count(*) from public.project_views v where v.project_id = p.id)
  from unnest(ids) as p(id)
$$;

grant execute on function public.project_stats(uuid[]) to anon, authenticated;
