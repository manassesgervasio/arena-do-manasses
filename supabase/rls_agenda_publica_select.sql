-- Policies de leitura publica para a Agenda.
-- Objetivo: permitir que visitantes anonimos vejam apenas dados necessarios
-- para ocupacao de horarios, sem liberar insert, update ou delete.
--
-- Observacao:
-- - Este SQL nao cria policies de escrita.
-- - Este SQL nao altera autenticacao.
-- - As policies abaixo filtram os dados por arenas ativas sempre que ha arena_id.

grant select on table public.arenas to anon;
grant select on table public.reservas to anon;
grant select on table public.mensalistas to anon;

drop policy if exists "agenda_publica_select_arenas_ativas" on public.arenas;

create policy "agenda_publica_select_arenas_ativas"
on public.arenas
for select
to anon
using (
  ativa = true
);

drop policy if exists "agenda_publica_select_reservas_arenas_ativas" on public.reservas;

create policy "agenda_publica_select_reservas_arenas_ativas"
on public.reservas
for select
to anon
using (
  arena_id in (
    select arenas.id
    from public.arenas
    where arenas.ativa = true
  )
);

drop policy if exists "agenda_publica_select_mensalistas_ativos" on public.mensalistas;

create policy "agenda_publica_select_mensalistas_ativos"
on public.mensalistas
for select
to anon
using (
  status = 'Ativo'
  and arena_id in (
    select arenas.id
    from public.arenas
    where arenas.ativa = true
  )
);

do $$
begin
  if to_regclass('public.mensalista_horarios') is not null then
    grant select on table public.mensalista_horarios to anon;

    drop policy if exists "agenda_publica_select_mensalista_horarios_ativos"
    on public.mensalista_horarios;

    create policy "agenda_publica_select_mensalista_horarios_ativos"
    on public.mensalista_horarios
    for select
    to anon
    using (
      ativo = true
      and arena_id in (
        select arenas.id
        from public.arenas
        where arenas.ativa = true
      )
    );
  end if;
end $$;
