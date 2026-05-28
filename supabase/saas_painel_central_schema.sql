alter table arenas
  add column if not exists plano text default 'teste',
  add column if not exists status_assinatura text default 'teste',
  add column if not exists data_inicio date default current_date,
  add column if not exists data_vencimento date,
  add column if not exists observacao_admin text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'arenas_plano_check'
      and conrelid = 'arenas'::regclass
  ) then
    alter table arenas
      add constraint arenas_plano_check
      check (plano in ('teste', 'basico', 'profissional', 'premium'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'arenas_status_assinatura_check'
      and conrelid = 'arenas'::regclass
  ) then
    alter table arenas
      add constraint arenas_status_assinatura_check
      check (status_assinatura in ('teste', 'ativo', 'suspenso', 'cancelado'));
  end if;
end $$;

alter table usuarios_sistema
  add column if not exists tipo_usuario text default 'arena';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'usuarios_sistema_tipo_usuario_check'
      and conrelid = 'usuarios_sistema'::regclass
  ) then
    alter table usuarios_sistema
      add constraint usuarios_sistema_tipo_usuario_check
      check (tipo_usuario in ('super_admin', 'arena'));
  end if;
end $$;

update usuarios_sistema
set
  tipo_usuario = 'super_admin',
  updated_at = now()
where email = 'manassesgervasio@hotmail.com';

update arenas
set
  plano = 'premium',
  status_assinatura = 'ativo',
  updated_at = now()
where slug = 'arena-do-manasses';

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'usuarios_arenas'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%perfil%'
  loop
    execute format(
      'alter table usuarios_arenas drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

update usuarios_arenas
set
  perfil = 'admin_arena',
  updated_at = now()
where perfil = 'admin';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'usuarios_arenas_perfil_check'
      and conrelid = 'usuarios_arenas'::regclass
  ) then
    alter table usuarios_arenas
      add constraint usuarios_arenas_perfil_check
      check (perfil in ('admin_arena', 'gerente', 'financeiro', 'atendente'));
  end if;
end $$;
