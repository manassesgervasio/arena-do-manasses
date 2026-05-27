create table if not exists financeiro_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('entrada', 'despesa')),
  ativo boolean default true,
  created_at timestamptz default now(),
  unique (nome, tipo)
);

create table if not exists financeiro_formas_pagamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(12,2) not null,
  tipo text not null check (tipo in ('entrada', 'despesa')),
  categoria_id uuid references financeiro_categorias(id),
  forma_pagamento_id uuid references financeiro_formas_pagamento(id),
  data_lancamento date not null,
  observacao text,
  origem text not null default 'manual' check (origem in ('manual', 'reserva', 'mensalista')),
  referencia_id uuid null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists financeiro_fechamentos_mensais (
  id uuid primary key default gen_random_uuid(),
  ano integer not null,
  mes integer not null check (mes between 1 and 12),
  total_reservas numeric(12,2) default 0,
  total_mensalistas numeric(12,2) default 0,
  total_entradas_manuais numeric(12,2) default 0,
  total_despesas numeric(12,2) default 0,
  saldo_liquido numeric(12,2) default 0,
  fechado boolean default false,
  fechado_em timestamptz,
  observacao text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (ano, mes)
);

create index if not exists idx_financeiro_lancamentos_data_lancamento
  on financeiro_lancamentos (data_lancamento);

create index if not exists idx_financeiro_lancamentos_tipo
  on financeiro_lancamentos (tipo);

create index if not exists idx_financeiro_lancamentos_categoria_id
  on financeiro_lancamentos (categoria_id);

create index if not exists idx_financeiro_lancamentos_forma_pagamento_id
  on financeiro_lancamentos (forma_pagamento_id);

insert into financeiro_categorias (nome, tipo)
values
  ('Reserva avulsa', 'entrada'),
  ('Mensalista', 'entrada'),
  ('Venda de produto', 'entrada'),
  ('Outros recebimentos', 'entrada'),
  ('Energia', 'despesa'),
  ('Agua', 'despesa'),
  ('Funcionario', 'despesa'),
  ('Manutencao', 'despesa'),
  ('Material de limpeza', 'despesa'),
  ('Internet', 'despesa'),
  ('Outros custos', 'despesa')
on conflict (nome, tipo) do nothing;

insert into financeiro_formas_pagamento (nome)
values
  ('Pix'),
  ('Dinheiro'),
  ('Cartao de credito'),
  ('Cartao de debito'),
  ('Transferencia'),
  ('Outro')
on conflict (nome) do nothing;
