-- ArenaBase - configuracao global da marca dos lances ArenaCam.
-- Esta marca e unica para todas as arenas e so pode ser alterada por super_admin.

begin;

create table if not exists public.sistema_config (
  id integer primary key default 1,
  logo_lances_url text,
  logo_lances_ativa boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint sistema_config_singleton_check check (id = 1)
);

insert into public.sistema_config (id, logo_lances_url, logo_lances_ativa)
values (1, null, false)
on conflict (id) do nothing;

alter table public.sistema_config enable row level security;

grant select on public.sistema_config to anon, authenticated;
grant insert, update on public.sistema_config to authenticated;
revoke delete on public.sistema_config from anon, authenticated;

drop policy if exists arenabase_sistema_config_select_global on public.sistema_config;
create policy arenabase_sistema_config_select_global
on public.sistema_config
for select
to anon, authenticated
using (true);

drop policy if exists arenabase_sistema_config_insert_super_admin on public.sistema_config;
create policy arenabase_sistema_config_insert_super_admin
on public.sistema_config
for insert
to authenticated
with check (
  id = 1
  and public.arenabase_is_super_admin()
);

drop policy if exists arenabase_sistema_config_update_super_admin on public.sistema_config;
create policy arenabase_sistema_config_update_super_admin
on public.sistema_config
for update
to authenticated
using (public.arenabase_is_super_admin())
with check (
  id = 1
  and public.arenabase_is_super_admin()
);

commit;
