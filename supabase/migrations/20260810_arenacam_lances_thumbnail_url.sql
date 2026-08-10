-- ArenaCam - URL opcional da thumbnail JPG dos replays.
-- Mantem compatibilidade com lances antigos que possuem apenas video_url.

begin;

alter table public.arenacam_lances
add column if not exists thumbnail_url text;

create or replace function public.arenacam_replays_publicos(
  p_arena_slug text
)
returns table (
  id uuid,
  camera_id text,
  created_at timestamptz,
  expires_at timestamptz,
  status text,
  video_url text,
  thumbnail_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.camera_id,
    l.created_at,
    l.expires_at,
    l.status,
    l.video_url,
    l.thumbnail_url
  from public.arenacam_lances l
  join public.arenas a on a.id = l.arena_id
  where a.slug = p_arena_slug
    and coalesce(a.ativa, false) = true
    and l.expires_at > now()
    and l.status <> 'expirado'
  order by l.created_at desc
$$;

grant execute on function public.arenacam_replays_publicos(text) to anon, authenticated;

commit;
