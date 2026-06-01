create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.arenas(id) on delete cascade,
  nome text not null,
  telefone text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_clientes_arena_telefone_unique
on public.clientes (arena_id, telefone);

create or replace function public.criar_ou_atualizar_cliente_publico(
  p_arena_id uuid,
  p_nome text,
  p_telefone text
)
returns public.clientes
language plpgsql
security definer
set search_path = public
as $$
declare
  cliente public.clientes;
begin
  if p_arena_id is null then
    raise exception 'Arena obrigatoria.';
  end if;

  if nullif(trim(p_nome), '') is null then
    raise exception 'Nome obrigatorio.';
  end if;

  if nullif(trim(p_telefone), '') is null then
    raise exception 'Telefone obrigatorio.';
  end if;

  if not exists (
    select 1
    from public.arenas
    where id = p_arena_id
      and ativa = true
  ) then
    raise exception 'Arena invalida ou inativa.';
  end if;

  insert into public.clientes (
    arena_id,
    nome,
    telefone,
    updated_at
  )
  values (
    p_arena_id,
    trim(p_nome),
    regexp_replace(p_telefone, '\D', '', 'g'),
    now()
  )
  on conflict (arena_id, telefone)
  do update set
    nome = excluded.nome,
    updated_at = now()
  returning * into cliente;

  return cliente;
end;
$$;

grant execute on function public.criar_ou_atualizar_cliente_publico(
  uuid,
  text,
  text
) to anon, authenticated;
