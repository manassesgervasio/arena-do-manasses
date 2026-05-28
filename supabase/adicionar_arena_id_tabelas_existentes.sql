alter table reservas
  add column if not exists arena_id uuid references arenas(id);

alter table mensalistas
  add column if not exists arena_id uuid references arenas(id);

alter table mensalista_horarios
  add column if not exists arena_id uuid references arenas(id);

alter table mensalista_pagamentos
  add column if not exists arena_id uuid references arenas(id);

alter table financeiro_lancamentos
  add column if not exists arena_id uuid references arenas(id);

alter table financeiro_fechamentos_mensais
  add column if not exists arena_id uuid references arenas(id);

update reservas
set arena_id = (select id from arenas where slug = 'arena-do-manasses')
where arena_id is null;

update mensalistas
set arena_id = (select id from arenas where slug = 'arena-do-manasses')
where arena_id is null;

update mensalista_horarios
set arena_id = (select id from arenas where slug = 'arena-do-manasses')
where arena_id is null;

update mensalista_pagamentos
set arena_id = (select id from arenas where slug = 'arena-do-manasses')
where arena_id is null;

update financeiro_lancamentos
set arena_id = (select id from arenas where slug = 'arena-do-manasses')
where arena_id is null;

update financeiro_fechamentos_mensais
set arena_id = (select id from arenas where slug = 'arena-do-manasses')
where arena_id is null;

create index if not exists idx_reservas_arena_id
  on reservas (arena_id);

create index if not exists idx_mensalistas_arena_id
  on mensalistas (arena_id);

create index if not exists idx_mensalista_horarios_arena_id
  on mensalista_horarios (arena_id);

create index if not exists idx_mensalista_pagamentos_arena_id
  on mensalista_pagamentos (arena_id);

create index if not exists idx_financeiro_lancamentos_arena_id
  on financeiro_lancamentos (arena_id);

create index if not exists idx_financeiro_fechamentos_mensais_arena_id
  on financeiro_fechamentos_mensais (arena_id);
