-- ArenaCam - metadados de lances e RLS por arena
-- Os arquivos de video continuam no Raspberry Pi; o Supabase guarda apenas metadados e URL.

begin;

create table if not exists public.arenacam_lances (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.arenas(id) on delete cascade,
  camera_id text not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null,
  video_url text,
  created_by uuid null references auth.users(id) on delete set null
);

create index if not exists idx_arenacam_lances_arena_id
  on public.arenacam_lances (arena_id);

create index if not exists idx_arenacam_lances_created_at
  on public.arenacam_lances (created_at);

create index if not exists idx_arenacam_lances_expires_at
  on public.arenacam_lances (expires_at);

alter table public.arenacam_lances enable row level security;

grant select, insert on public.arenacam_lances to authenticated;
revoke all on public.arenacam_lances from anon;

drop policy if exists arenabase_arenacam_lances_select_vinculo on public.arenacam_lances;
create policy arenabase_arenacam_lances_select_vinculo
on public.arenacam_lances
for select
to authenticated
using (
  public.arenabase_has_arena_role(arena_id)
);

drop policy if exists arenabase_arenacam_lances_insert_vinculo on public.arenacam_lances;
create policy arenabase_arenacam_lances_insert_vinculo
on public.arenacam_lances
for insert
to authenticated
with check (
  public.arenabase_has_arena_role(arena_id)
);

commit;
