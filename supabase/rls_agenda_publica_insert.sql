-- Policies para solicitacao publica de reserva pela Agenda.
-- Objetivo: permitir que visitante crie somente reservas PENDENTES,
-- sem liberar leitura adicional, edicao, exclusao ou pagamento.
--
-- Rode este SQL somente apos revisar.

grant insert on table public.reservas to anon;

drop policy if exists "agenda_publica_insert_reservas_pendentes" on public.reservas;

create policy "agenda_publica_insert_reservas_pendentes"
on public.reservas
for insert
to anon
with check (
  status = 'Pendente'
  and tipo = 'Avulso'
  and origem = 'Publica'
  and arena_id in (
    select arenas.id
    from public.arenas
    where arenas.ativa = true
  )
);
