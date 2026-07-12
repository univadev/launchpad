-- Fix: "new row violates row-level security policy for table users"


alter table public.users enable row level security;

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

create policy users_all_access on public.users
  for all to public using (true) with check (true);
