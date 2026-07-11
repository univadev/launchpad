
begin;

do $$
declare r record;
begin
  for r in
    select rel.relname as tbl, con.conname as name
    from pg_constraint con
    join pg_class rel    on rel.oid  = con.conrelid
    join pg_class frel   on frel.oid = con.confrelid
    join pg_namespace ns on ns.oid   = rel.relnamespace
    where con.contype = 'f' and ns.nspname = 'public' and frel.relname = 'users'
  loop
    execute format('alter table public.%I drop constraint %I', r.tbl, r.name);
  end loop;
end $$;

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

do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel    on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid  = rel.relnamespace
    where con.contype = 'c' and ns.nspname = 'public' and rel.relname = 'connections'
      and pg_get_constraintdef(con.oid) ilike '%requester_id%'
      and pg_get_constraintdef(con.oid) ilike '%recipient_id%'
  loop
    execute format('alter table public.connections drop constraint %I', r.conname);
  end loop;
end $$;

do $$
declare
  cols text[][] := array[
    ['users','id'],['projects','user_id'],['reactions','user_id'],
    ['comments','user_id'],['notifications','user_id'],
    ['connections','requester_id'],['connections','recipient_id'],['project_views','user_id']
  ];
  c text[];
begin
  foreach c slice 1 in array cols loop
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=c[1] and column_name=c[2] and data_type='uuid'
    ) then
      execute format('alter table public.%I alter column %I type text using %I::text', c[1], c[2], c[2]);
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.projects')      is not null then alter table public.projects      add constraint projects_user_id_fkey      foreign key (user_id)      references public.users(id) on update cascade on delete cascade;   end if;
  if to_regclass('public.reactions')     is not null then alter table public.reactions     add constraint reactions_user_id_fkey     foreign key (user_id)      references public.users(id) on update cascade on delete cascade;   end if;
  if to_regclass('public.comments')      is not null then alter table public.comments      add constraint comments_user_id_fkey      foreign key (user_id)      references public.users(id) on update cascade on delete cascade;   end if;
  if to_regclass('public.notifications') is not null then alter table public.notifications add constraint notifications_user_id_fkey foreign key (user_id)      references public.users(id) on update cascade on delete cascade;   end if;
  if to_regclass('public.connections')   is not null then
    alter table public.connections add constraint connections_requester_id_fkey foreign key (requester_id) references public.users(id) on update cascade on delete cascade;
    alter table public.connections add constraint connections_recipient_id_fkey foreign key (recipient_id) references public.users(id) on update cascade on delete cascade;
  end if;
  if to_regclass('public.project_views') is not null then alter table public.project_views add constraint project_views_user_id_fkey foreign key (user_id) references public.users(id) on update cascade on delete set null; end if;
end $$;

do $$
begin
  if to_regclass('public.connections') is not null then
    alter table public.connections add constraint connections_requester_recipient_check check (requester_id <> recipient_id);
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['users','projects','reactions','comments','notifications','connections','project_views'] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('create policy %I on public.%I for all to public using (true) with check (true)', t||'_all_access', t);
    end if;
  end loop;
end $$;

commit;
