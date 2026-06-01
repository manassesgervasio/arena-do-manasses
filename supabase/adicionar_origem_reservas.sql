alter table public.reservas
add column if not exists origem text;

update public.reservas
set origem = 'Fixo'
where tipo = 'Fixo'
  and origem is null;

update public.reservas
set origem = 'Mensalista'
where tipo = 'Mensalista'
  and origem is null;

update public.reservas
set origem = 'Manual'
where origem is null;
