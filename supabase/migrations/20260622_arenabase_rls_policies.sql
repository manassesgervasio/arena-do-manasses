-- ArenaBase - RLS completo por arena e perfil
-- Data: 2026-06-22
--
-- IMPORTANTE:
-- 1. Esta migration foi criada para versionamento e revisao. Nao execute em producao sem validar o schema atual.
-- 2. As policies abaixo assumem que as tabelas ja possuem arena_id onde indicado.
-- 3. O slug interno arena-do-manasses nao e alterado.
-- 4. A exposicao publica direta de reservas/mensalistas e removida; a agenda publica deve usar a view/RPC sanitizada abaixo.

begin;

-- ============================================================
-- Helpers de perfil e vinculo ativo
-- ============================================================

-- Resolve o usuario interno a partir do e-mail do JWT do Supabase Auth.
create or replace function public.arenabase_current_usuario_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select us.id
  from public.usuarios_sistema us
  where lower(us.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and coalesce(us.ativo, false) = true
  limit 1
$$;

-- Super admin tem acesso global.
create or replace function public.arenabase_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios_sistema us
    where us.id = public.arenabase_current_usuario_id()
      and us.perfil = 'super_admin'
      and coalesce(us.ativo, false) = true
  )
$$;

-- Verifica se o usuario atual possui algum dos perfis informados em qualquer arena.
create or replace function public.arenabase_has_any_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.arenabase_is_super_admin()
    or exists (
      select 1
      from public.usuarios_arenas ua
      join public.usuarios_sistema us on us.id = ua.usuario_id
      where us.id = public.arenabase_current_usuario_id()
        and coalesce(us.ativo, false) = true
        and coalesce(ua.ativo, false) = true
        and ua.perfil = any(p_roles)
    )
$$;

-- Verifica vinculo ativo do usuario atual com uma arena especifica.
-- Se p_roles for null, basta existir vinculo ativo.
create or replace function public.arenabase_has_arena_role(p_arena_id uuid, p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.arenabase_is_super_admin()
    or exists (
      select 1
      from public.usuarios_arenas ua
      join public.usuarios_sistema us on us.id = ua.usuario_id
      where us.id = public.arenabase_current_usuario_id()
        and coalesce(us.ativo, false) = true
        and coalesce(ua.ativo, false) = true
        and ua.arena_id = p_arena_id
        and (p_roles is null or ua.perfil = any(p_roles))
    )
$$;

-- ============================================================
-- RLS: ativacao
-- ============================================================

alter table public.arenas enable row level security;
alter table public.usuarios_sistema enable row level security;
alter table public.usuarios_arenas enable row level security;
alter table public.reservas enable row level security;
alter table public.mensalistas enable row level security;
alter table public.mensalista_pagamentos enable row level security;
alter table public.financeiro_lancamentos enable row level security;
alter table public.financeiro_fechamentos_mensais enable row level security;

-- Tabela opcional detectada no projeto: clientes publicos.
-- Mantida em bloco separado porque nao faz parte da lista principal, mas participa dos fluxos de atendimento.
do $$
begin
  if to_regclass('public.clientes') is not null then
    execute 'alter table public.clientes enable row level security';
  end if;
end $$;

-- Grants basicos. As policies abaixo continuam sendo a barreira efetiva.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.arenas to authenticated;
grant select, insert, update, delete on public.usuarios_sistema to authenticated;
grant select, insert, update, delete on public.usuarios_arenas to authenticated;
grant select, insert, update, delete on public.reservas to authenticated;
grant select, insert, update, delete on public.mensalistas to authenticated;
grant select, insert, update, delete on public.mensalista_pagamentos to authenticated;
grant select, insert, update, delete on public.financeiro_lancamentos to authenticated;
grant select, insert, update, delete on public.financeiro_fechamentos_mensais to authenticated;

-- Remove exposicao anonima direta de tabelas sensiveis criada por policies antigas.
revoke all on public.arenas from anon;
revoke all on public.reservas from anon;
revoke all on public.mensalistas from anon;
revoke all on public.mensalista_horarios from anon;
grant insert on public.reservas to anon;

-- ============================================================
-- Agenda publica sanitizada
-- ============================================================

-- View publica com campos minimos de arenas ativas.
-- Nao expor plano, status SaaS, observacoes administrativas ou outros metadados internos.
create or replace view public.agenda_publica_arenas as
select
  a.id,
  a.nome,
  a.slug,
  a.telefone
from public.arenas a
where coalesce(a.ativa, false) = true;

grant select on public.agenda_publica_arenas to anon, authenticated;

-- RPC publica para horarios ocupados sem dados pessoais.
-- Nao retorna nome, telefone, valor, observacoes ou identificadores de cliente.
create or replace function public.agenda_publica_horarios_ocupados(
  p_arena_slug text,
  p_data_inicio date,
  p_data_fim date
)
returns table (
  arena_id uuid,
  data date,
  horario text,
  ocupado boolean,
  status_publico text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.arena_id,
    r.data,
    r.horario,
    true as ocupado,
    case
      when r.status = 'Pendente' then 'Pendente'
      else 'Ocupado'
    end as status_publico
  from public.reservas r
  join public.arenas a on a.id = r.arena_id
  where a.slug = p_arena_slug
    and coalesce(a.ativa, false) = true
    and r.data between p_data_inicio and p_data_fim
    and (
      r.status in ('Pendente', 'Reservado', 'Pago')
      or r.tipo in ('Fixo', 'Mensalista')
    )

  union

  select
    mh.arena_id,
    dias.data::date,
    mh.horario,
    true as ocupado,
    'Ocupado' as status_publico
  from generate_series(p_data_inicio, p_data_fim, interval '1 day') as dias(data)
  join public.arenas a on a.slug = p_arena_slug
  join public.mensalista_horarios mh on mh.arena_id = a.id
  join public.mensalistas m on m.id = mh.mensalista_id and m.arena_id = mh.arena_id
  where coalesce(a.ativa, false) = true
    and coalesce(mh.ativo, false) = true
    and coalesce(m.status, '') = 'Ativo'
    and mh.dia_semana = extract(dow from dias.data)::int
$$;

grant execute on function public.agenda_publica_horarios_ocupados(text, date, date) to anon, authenticated;

-- ============================================================
-- Limpeza de policies antigas conhecidas
-- ============================================================

drop policy if exists agenda_publica_select_arenas_ativas on public.arenas;
drop policy if exists agenda_publica_select_reservas_arenas_ativas on public.reservas;
drop policy if exists agenda_publica_select_mensalistas_ativos on public.mensalistas;
drop policy if exists agenda_publica_select_mensalista_horarios_ativos on public.mensalista_horarios;
drop policy if exists agenda_publica_insert_reservas_pendentes on public.reservas;
drop policy if exists reservas_delete_admin_arena on public.reservas;

-- ============================================================
-- arenas
-- ============================================================

-- SELECT: super_admin ve tudo; usuarios vinculados veem apenas suas arenas.
drop policy if exists arenabase_arenas_select_vinculo on public.arenas;
create policy arenabase_arenas_select_vinculo
on public.arenas
for select
to authenticated
using (
  public.arenabase_is_super_admin()
  or public.arenabase_has_arena_role(id)
);

-- INSERT: criacao de arena e responsabilidade SaaS ficam restritas ao super_admin.
drop policy if exists arenabase_arenas_insert_super_admin on public.arenas;
create policy arenabase_arenas_insert_super_admin
on public.arenas
for insert
to authenticated
with check (public.arenabase_is_super_admin());

-- UPDATE: super_admin altera tudo; admin_arena altera apenas a propria arena.
drop policy if exists arenabase_arenas_update_admin_arena on public.arenas;
create policy arenabase_arenas_update_admin_arena
on public.arenas
for update
to authenticated
using (
  public.arenabase_is_super_admin()
  or public.arenabase_has_arena_role(id, array['admin_arena'])
)
with check (
  public.arenabase_is_super_admin()
  or public.arenabase_has_arena_role(id, array['admin_arena'])
);

-- DELETE: exclusao da arena e operacao critica, restrita ao super_admin.
drop policy if exists arenabase_arenas_delete_super_admin on public.arenas;
create policy arenabase_arenas_delete_super_admin
on public.arenas
for delete
to authenticated
using (public.arenabase_is_super_admin());

-- ============================================================
-- usuarios_sistema
-- ============================================================

-- SELECT: usuario ve o proprio cadastro; admin_arena ve usuarios vinculados a sua arena; super_admin ve tudo.
drop policy if exists arenabase_usuarios_sistema_select_escopo on public.usuarios_sistema;
create policy arenabase_usuarios_sistema_select_escopo
on public.usuarios_sistema
for select
to authenticated
using (
  public.arenabase_is_super_admin()
  or id = public.arenabase_current_usuario_id()
  or exists (
    select 1
    from public.usuarios_arenas alvo
    join public.usuarios_arenas atual on atual.arena_id = alvo.arena_id
    where alvo.usuario_id = usuarios_sistema.id
      and atual.usuario_id = public.arenabase_current_usuario_id()
      and coalesce(alvo.ativo, false) = true
      and coalesce(atual.ativo, false) = true
      and atual.perfil = 'admin_arena'
  )
);

-- INSERT: super_admin e admin_arena podem criar usuarios operacionais.
-- Como usuarios_sistema nao possui arena_id, o vinculo efetivo deve ser criado em usuarios_arenas.
drop policy if exists arenabase_usuarios_sistema_insert_admin on public.usuarios_sistema;
create policy arenabase_usuarios_sistema_insert_admin
on public.usuarios_sistema
for insert
to authenticated
with check (
  public.arenabase_is_super_admin()
  or public.arenabase_has_any_role(array['admin_arena'])
);

-- UPDATE: super_admin e admin_arena podem atualizar usuarios do seu escopo; usuario pode atualizar o proprio cadastro.
drop policy if exists arenabase_usuarios_sistema_update_escopo on public.usuarios_sistema;
create policy arenabase_usuarios_sistema_update_escopo
on public.usuarios_sistema
for update
to authenticated
using (
  public.arenabase_is_super_admin()
  or id = public.arenabase_current_usuario_id()
  or exists (
    select 1
    from public.usuarios_arenas alvo
    join public.usuarios_arenas atual on atual.arena_id = alvo.arena_id
    where alvo.usuario_id = usuarios_sistema.id
      and atual.usuario_id = public.arenabase_current_usuario_id()
      and coalesce(alvo.ativo, false) = true
      and coalesce(atual.ativo, false) = true
      and atual.perfil = 'admin_arena'
  )
)
with check (
  public.arenabase_is_super_admin()
  or id = public.arenabase_current_usuario_id()
  or public.arenabase_has_any_role(array['admin_arena'])
);

-- DELETE: remocao global de usuario fica restrita ao super_admin.
drop policy if exists arenabase_usuarios_sistema_delete_super_admin on public.usuarios_sistema;
create policy arenabase_usuarios_sistema_delete_super_admin
on public.usuarios_sistema
for delete
to authenticated
using (public.arenabase_is_super_admin());

-- ============================================================
-- usuarios_arenas
-- ============================================================

-- SELECT: usuario ve seu proprio vinculo; admin_arena ve vinculos da propria arena; super_admin ve tudo.
drop policy if exists arenabase_usuarios_arenas_select_escopo on public.usuarios_arenas;
create policy arenabase_usuarios_arenas_select_escopo
on public.usuarios_arenas
for select
to authenticated
using (
  public.arenabase_is_super_admin()
  or usuario_id = public.arenabase_current_usuario_id()
  or public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- INSERT: vinculos so podem ser criados por super_admin ou admin_arena da propria arena.
drop policy if exists arenabase_usuarios_arenas_insert_admin_arena on public.usuarios_arenas;
create policy arenabase_usuarios_arenas_insert_admin_arena
on public.usuarios_arenas
for insert
to authenticated
with check (
  public.arenabase_is_super_admin()
  or public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- UPDATE: admin_arena gerencia apenas vinculos da propria arena.
drop policy if exists arenabase_usuarios_arenas_update_admin_arena on public.usuarios_arenas;
create policy arenabase_usuarios_arenas_update_admin_arena
on public.usuarios_arenas
for update
to authenticated
using (
  public.arenabase_is_super_admin()
  or public.arenabase_has_arena_role(arena_id, array['admin_arena'])
)
with check (
  public.arenabase_is_super_admin()
  or public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- DELETE: remocao de vinculo operacional fica restrita a super_admin/admin_arena da propria arena.
drop policy if exists arenabase_usuarios_arenas_delete_admin_arena on public.usuarios_arenas;
create policy arenabase_usuarios_arenas_delete_admin_arena
on public.usuarios_arenas
for delete
to authenticated
using (
  public.arenabase_is_super_admin()
  or public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- ============================================================
-- reservas
-- ============================================================

-- SELECT: perfis operacionais veem apenas reservas da propria arena; financeiro tem leitura basica.
drop policy if exists arenabase_reservas_select_operacional on public.reservas;
create policy arenabase_reservas_select_operacional
on public.reservas
for select
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'financeiro', 'atendente'])
);

-- INSERT: agenda interna pode ser criada por admin_arena, gerente e atendente da propria arena.
drop policy if exists arenabase_reservas_insert_operacional on public.reservas;
create policy arenabase_reservas_insert_operacional
on public.reservas
for insert
to authenticated
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'atendente'])
);

-- INSERT anonimo: somente reserva publica pendente, avulsa, de arena ativa.
drop policy if exists arenabase_reservas_insert_publica_pendente on public.reservas;
create policy arenabase_reservas_insert_publica_pendente
on public.reservas
for insert
to anon
with check (
  status = 'Pendente'
  and tipo = 'Avulso'
  and origem = 'Publica'
  and exists (
    select 1
    from public.arenas a
    where a.id = reservas.arena_id
      and coalesce(a.ativa, false) = true
  )
);

-- UPDATE: gerente e atendente podem gerenciar agenda da propria arena; financeiro nao altera reservas.
drop policy if exists arenabase_reservas_update_operacional on public.reservas;
create policy arenabase_reservas_update_operacional
on public.reservas
for update
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'atendente'])
)
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'atendente'])
);

-- DELETE: exclusao de reserva fica restrita a super_admin/admin_arena da propria arena.
drop policy if exists arenabase_reservas_delete_admin_arena on public.reservas;
create policy arenabase_reservas_delete_admin_arena
on public.reservas
for delete
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- ============================================================
-- mensalistas
-- ============================================================

-- SELECT: admin_arena e gerente veem mensalistas da propria arena.
drop policy if exists arenabase_mensalistas_select_gestao on public.mensalistas;
create policy arenabase_mensalistas_select_gestao
on public.mensalistas
for select
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente'])
);

-- INSERT: criacao de mensalista somente por admin_arena/gerente da propria arena.
drop policy if exists arenabase_mensalistas_insert_gestao on public.mensalistas;
create policy arenabase_mensalistas_insert_gestao
on public.mensalistas
for insert
to authenticated
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente'])
);

-- UPDATE: manutencao de mensalista somente por admin_arena/gerente da propria arena.
drop policy if exists arenabase_mensalistas_update_gestao on public.mensalistas;
create policy arenabase_mensalistas_update_gestao
on public.mensalistas
for update
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente'])
)
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente'])
);

-- DELETE: exclusao de mensalista e critica; somente super_admin/admin_arena.
drop policy if exists arenabase_mensalistas_delete_admin_arena on public.mensalistas;
create policy arenabase_mensalistas_delete_admin_arena
on public.mensalistas
for delete
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- ============================================================
-- mensalista_pagamentos
-- ============================================================

-- SELECT: admin_arena, gerente e financeiro veem pagamentos da propria arena.
drop policy if exists arenabase_mensalista_pagamentos_select_escopo on public.mensalista_pagamentos;
create policy arenabase_mensalista_pagamentos_select_escopo
on public.mensalista_pagamentos
for select
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'financeiro'])
);

-- INSERT: pagamentos podem ser registrados por admin_arena, gerente e financeiro da propria arena.
drop policy if exists arenabase_mensalista_pagamentos_insert_escopo on public.mensalista_pagamentos;
create policy arenabase_mensalista_pagamentos_insert_escopo
on public.mensalista_pagamentos
for insert
to authenticated
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'financeiro'])
);

-- UPDATE: pagamentos podem ser ajustados por admin_arena, gerente e financeiro da propria arena.
drop policy if exists arenabase_mensalista_pagamentos_update_escopo on public.mensalista_pagamentos;
create policy arenabase_mensalista_pagamentos_update_escopo
on public.mensalista_pagamentos
for update
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'financeiro'])
)
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'financeiro'])
);

-- DELETE: exclusao de pagamento e critica; somente super_admin/admin_arena.
drop policy if exists arenabase_mensalista_pagamentos_delete_admin_arena on public.mensalista_pagamentos;
create policy arenabase_mensalista_pagamentos_delete_admin_arena
on public.mensalista_pagamentos
for delete
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- ============================================================
-- financeiro_lancamentos
-- ============================================================

-- SELECT: financeiro isolado por arena para admin_arena e financeiro.
drop policy if exists arenabase_financeiro_lancamentos_select_escopo on public.financeiro_lancamentos;
create policy arenabase_financeiro_lancamentos_select_escopo
on public.financeiro_lancamentos
for select
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'financeiro'])
);

-- INSERT: lancamentos financeiros criados por admin_arena e financeiro da propria arena.
drop policy if exists arenabase_financeiro_lancamentos_insert_escopo on public.financeiro_lancamentos;
create policy arenabase_financeiro_lancamentos_insert_escopo
on public.financeiro_lancamentos
for insert
to authenticated
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'financeiro'])
);

-- UPDATE: lancamentos financeiros ajustados por admin_arena e financeiro da propria arena.
drop policy if exists arenabase_financeiro_lancamentos_update_escopo on public.financeiro_lancamentos;
create policy arenabase_financeiro_lancamentos_update_escopo
on public.financeiro_lancamentos
for update
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'financeiro'])
)
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'financeiro'])
);

-- DELETE: exclusao de lancamentos criticos somente para super_admin/admin_arena.
drop policy if exists arenabase_financeiro_lancamentos_delete_admin_arena on public.financeiro_lancamentos;
create policy arenabase_financeiro_lancamentos_delete_admin_arena
on public.financeiro_lancamentos
for delete
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- ============================================================
-- financeiro_fechamentos_mensais
-- ============================================================

-- SELECT: fechamentos isolados por arena para admin_arena e financeiro.
drop policy if exists arenabase_financeiro_fechamentos_select_escopo on public.financeiro_fechamentos_mensais;
create policy arenabase_financeiro_fechamentos_select_escopo
on public.financeiro_fechamentos_mensais
for select
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena', 'financeiro'])
);

-- INSERT: fechamento mensal e acao critica; somente super_admin/admin_arena.
drop policy if exists arenabase_financeiro_fechamentos_insert_admin_arena on public.financeiro_fechamentos_mensais;
create policy arenabase_financeiro_fechamentos_insert_admin_arena
on public.financeiro_fechamentos_mensais
for insert
to authenticated
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- UPDATE: reabertura/ajuste de fechamento e acao critica; somente super_admin/admin_arena.
drop policy if exists arenabase_financeiro_fechamentos_update_admin_arena on public.financeiro_fechamentos_mensais;
create policy arenabase_financeiro_fechamentos_update_admin_arena
on public.financeiro_fechamentos_mensais
for update
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
)
with check (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- DELETE: exclusao de fechamento e critica; somente super_admin/admin_arena.
drop policy if exists arenabase_financeiro_fechamentos_delete_admin_arena on public.financeiro_fechamentos_mensais;
create policy arenabase_financeiro_fechamentos_delete_admin_arena
on public.financeiro_fechamentos_mensais
for delete
to authenticated
using (
  public.arenabase_has_arena_role(arena_id, array['admin_arena'])
);

-- ============================================================
-- clientes publicos/opcionais
-- ============================================================

-- A tabela public.clientes existe nos scripts do projeto. Mantemos RLS por arena quando ela estiver presente.
do $$
begin
  if to_regclass('public.clientes') is not null then
    execute 'grant select, insert, update, delete on public.clientes to authenticated';

    execute 'drop policy if exists arenabase_clientes_select_operacional on public.clientes';
    execute $policy$
      create policy arenabase_clientes_select_operacional
      on public.clientes
      for select
      to authenticated
      using (
        public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'atendente'])
      )
    $policy$;

    execute 'drop policy if exists arenabase_clientes_insert_operacional on public.clientes';
    execute $policy$
      create policy arenabase_clientes_insert_operacional
      on public.clientes
      for insert
      to authenticated
      with check (
        public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'atendente'])
      )
    $policy$;

    execute 'drop policy if exists arenabase_clientes_update_operacional on public.clientes';
    execute $policy$
      create policy arenabase_clientes_update_operacional
      on public.clientes
      for update
      to authenticated
      using (
        public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'atendente'])
      )
      with check (
        public.arenabase_has_arena_role(arena_id, array['admin_arena', 'gerente', 'atendente'])
      )
    $policy$;

    execute 'drop policy if exists arenabase_clientes_delete_admin_arena on public.clientes';
    execute $policy$
      create policy arenabase_clientes_delete_admin_arena
      on public.clientes
      for delete
      to authenticated
      using (
        public.arenabase_has_arena_role(arena_id, array['admin_arena'])
      )
    $policy$;
  end if;
end $$;

-- ============================================================
-- Financeiro: unique mensal por arena
-- ============================================================

-- Sugestao NAO EXECUTADA nesta migration:
-- O schema base do projeto possui unique (ano, mes) em financeiro_fechamentos_mensais.
-- Em ambiente multiarena, o correto e unique (arena_id, ano, mes).
-- Validar o nome real da constraint antes de aplicar algo como:
--
-- alter table public.financeiro_fechamentos_mensais
--   drop constraint if exists financeiro_fechamentos_mensais_ano_mes_key;
--
-- create unique index if not exists financeiro_fechamentos_mensais_arena_ano_mes_idx
--   on public.financeiro_fechamentos_mensais (arena_id, ano, mes);

commit;
