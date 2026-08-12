-- ArenaCam - logos por arena para personalizacao futura de replays.
-- Esta etapa cadastra e protege os arquivos; nao altera o processamento dos cortes.

begin;

create table if not exists public.arenacam_logos (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.arenas(id) on delete cascade,
  tipo text not null,
  nome text not null,
  storage_path text not null,
  ativo boolean not null default true,
  posicao text not null default 'bottom-right',
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint arenacam_logos_tipo_check
    check (tipo in ('arena', 'patrocinador')),
  constraint arenacam_logos_posicao_check
    check (posicao in ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center-bottom')),
  constraint arenacam_logos_storage_path_arena_check
    check (
      (
        tipo = 'arena'
        and storage_path like arena_id::text || '/arena/%'
      )
      or (
        tipo = 'patrocinador'
        and storage_path like arena_id::text || '/patrocinadores/%'
      )
    )
);

create index if not exists idx_arenacam_logos_arena_id
  on public.arenacam_logos (arena_id);

create unique index if not exists arenacam_logos_unica_logo_arena_idx
  on public.arenacam_logos (arena_id)
  where tipo = 'arena';

create or replace function public.arenabase_arenacam_logos_limite_patrocinadores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_patrocinadores integer;
begin
  if new.tipo <> 'patrocinador' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.arena_id::text, 0));

  select count(*)
  into total_patrocinadores
  from public.arenacam_logos logo
  where logo.arena_id = new.arena_id
    and logo.tipo = 'patrocinador'
    and logo.id <> new.id;

  if total_patrocinadores >= 5 then
    raise exception 'Limite de 5 patrocinadores por arena atingido.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists arenabase_arenacam_logos_limite_patrocinadores on public.arenacam_logos;
create trigger arenabase_arenacam_logos_limite_patrocinadores
before insert or update of arena_id, tipo
on public.arenacam_logos
for each row
execute function public.arenabase_arenacam_logos_limite_patrocinadores();

alter table public.arenacam_logos enable row level security;

grant select, insert, update, delete on public.arenacam_logos to authenticated;
revoke all on public.arenacam_logos from anon;

drop policy if exists arenabase_arenacam_logos_select_vinculo on public.arenacam_logos;
create policy arenabase_arenacam_logos_select_vinculo
on public.arenacam_logos
for select
to authenticated
using (
  public.arenabase_has_arena_role(arena_id)
);

drop policy if exists arenabase_arenacam_logos_insert_admin_arena on public.arenacam_logos;
create policy arenabase_arenacam_logos_insert_admin_arena
on public.arenacam_logos
for insert
to authenticated
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
  and (
    (
      tipo = 'arena'
      and storage_path like arena_id::text || '/arena/%'
    )
    or (
      tipo = 'patrocinador'
      and storage_path like arena_id::text || '/patrocinadores/%'
    )
  )
);

drop policy if exists arenabase_arenacam_logos_update_admin_arena on public.arenacam_logos;
create policy arenabase_arenacam_logos_update_admin_arena
on public.arenacam_logos
for update
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
)
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
  and (
    (
      tipo = 'arena'
      and storage_path like arena_id::text || '/arena/%'
    )
    or (
      tipo = 'patrocinador'
      and storage_path like arena_id::text || '/patrocinadores/%'
    )
  )
);

drop policy if exists arenabase_arenacam_logos_delete_admin_arena on public.arenacam_logos;
create policy arenabase_arenacam_logos_delete_admin_arena
on public.arenacam_logos
for delete
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'arenacam-logos',
  'arenacam-logos',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.arenabase_arenacam_logo_storage_arena_id(p_name text)
returns uuid
language plpgsql
stable
set search_path = public, storage
as $$
declare
  primeiro_segmento text;
begin
  primeiro_segmento := (storage.foldername(coalesce(p_name, '')))[1];

  if primeiro_segmento is null
    or primeiro_segmento !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return null;
  end if;

  return primeiro_segmento::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.arenabase_arenacam_logo_storage_path_permitido(p_name text)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  arena_id_path uuid;
begin
  arena_id_path := public.arenabase_arenacam_logo_storage_arena_id(p_name);

  if arena_id_path is null then
    return false;
  end if;

  return p_name like arena_id_path::text || '/arena/%'
    or p_name like arena_id_path::text || '/patrocinadores/%';
end;
$$;

drop policy if exists arenabase_arenacam_logos_storage_select_vinculo on storage.objects;
create policy arenabase_arenacam_logos_storage_select_vinculo
on storage.objects
for select
to authenticated
using (
  bucket_id = 'arenacam-logos'
  and public.arenabase_arenacam_logo_storage_path_permitido(name)
  and public.arenabase_has_arena_role(
    public.arenabase_arenacam_logo_storage_arena_id(name)
  )
);

drop policy if exists arenabase_arenacam_logos_storage_insert_admin_arena on storage.objects;
create policy arenabase_arenacam_logos_storage_insert_admin_arena
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'arenacam-logos'
  and public.arenabase_arenacam_logo_storage_path_permitido(name)
  and public.arenabase_has_arena_role(
    public.arenabase_arenacam_logo_storage_arena_id(name),
    array['admin_arena']
  )
);

drop policy if exists arenabase_arenacam_logos_storage_update_admin_arena on storage.objects;
create policy arenabase_arenacam_logos_storage_update_admin_arena
on storage.objects
for update
to authenticated
using (
  bucket_id = 'arenacam-logos'
  and public.arenabase_arenacam_logo_storage_path_permitido(name)
  and public.arenabase_has_arena_role(
    public.arenabase_arenacam_logo_storage_arena_id(name),
    array['admin_arena']
  )
)
with check (
  bucket_id = 'arenacam-logos'
  and public.arenabase_arenacam_logo_storage_path_permitido(name)
  and public.arenabase_has_arena_role(
    public.arenabase_arenacam_logo_storage_arena_id(name),
    array['admin_arena']
  )
);

drop policy if exists arenabase_arenacam_logos_storage_delete_admin_arena on storage.objects;
create policy arenabase_arenacam_logos_storage_delete_admin_arena
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'arenacam-logos'
  and public.arenabase_arenacam_logo_storage_path_permitido(name)
  and public.arenabase_has_arena_role(
    public.arenabase_arenacam_logo_storage_arena_id(name),
    array['admin_arena']
  )
);

commit;
