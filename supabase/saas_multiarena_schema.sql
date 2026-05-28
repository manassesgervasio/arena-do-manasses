create table if not exists arenas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  telefone text,
  cidade text,
  estado text,
  ativa boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  telefone text,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists usuarios_arenas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios_sistema(id) on delete cascade,
  arena_id uuid not null references arenas(id) on delete cascade,
  perfil text not null check (perfil in ('admin', 'gerente', 'financeiro', 'atendente')),
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (usuario_id, arena_id)
);

create index if not exists idx_usuarios_arenas_usuario_id
  on usuarios_arenas (usuario_id);

create index if not exists idx_usuarios_arenas_arena_id
  on usuarios_arenas (arena_id);

create index if not exists idx_usuarios_arenas_perfil
  on usuarios_arenas (perfil);

insert into arenas (nome, slug, estado)
values ('Arena do Manassés', 'arena-do-manasses', 'PA')
on conflict (slug) do nothing;

insert into usuarios_sistema (nome, email)
values ('Manasses Gervasio', 'manassesgervasio@hotmail.com')
on conflict (email) do nothing;

insert into usuarios_arenas (usuario_id, arena_id, perfil)
select
  usuarios_sistema.id,
  arenas.id,
  'admin'
from usuarios_sistema
cross join arenas
where usuarios_sistema.email = 'manassesgervasio@hotmail.com'
  and arenas.slug = 'arena-do-manasses'
on conflict (usuario_id, arena_id) do nothing;
