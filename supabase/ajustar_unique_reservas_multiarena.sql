-- Ajusta a unicidade de reservas para o modo multiarena.
-- Nao aplicar automaticamente. Revise e execute no Supabase quando precisar.

-- Remove constraints UNIQUE antigas que bloqueiam a mesma data/horario em arenas diferentes.
do $$
declare
  item record;
begin
  for item in
    select
      c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join unnest(c.conkey) as coluna(attnum) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = coluna.attnum
    where n.nspname = 'public'
      and t.relname = 'reservas'
      and c.contype = 'u'
    group by c.conname
    having array_agg(a.attname order by a.attname) = array['data', 'horario']
  loop
    execute format('alter table public.reservas drop constraint if exists %I', item.conname);
  end loop;
end $$;

-- Remove indices UNIQUE antigos equivalentes, caso tenham sido criados fora de constraints.
do $$
declare
  item record;
begin
  for item in
    select
      i.relname as index_name
    from pg_index idx
    join pg_class t on t.oid = idx.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_class i on i.oid = idx.indexrelid
    join unnest(idx.indkey) as coluna(attnum) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = coluna.attnum
    left join pg_constraint c on c.conindid = idx.indexrelid
    where n.nspname = 'public'
      and t.relname = 'reservas'
      and idx.indisunique = true
      and c.oid is null
    group by i.relname
    having array_agg(a.attname order by a.attname) = array['data', 'horario']
  loop
    execute format('drop index if exists public.%I', item.index_name);
  end loop;
end $$;

-- Cria a unicidade correta para separar reservas por arena.
create unique index if not exists idx_reservas_arena_data_horario_unique
  on public.reservas (arena_id, data, horario);
