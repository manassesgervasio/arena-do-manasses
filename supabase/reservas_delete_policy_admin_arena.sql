-- Policy segura para permitir DELETE de reservas apenas por usuarios autorizados.
-- Nao aplicar automaticamente sem revisar no Supabase.
-- Use se a verificacao pos-delete mostrar que a reserva continua existindo.

drop policy if exists reservas_delete_admin_arena on public.reservas;

create policy reservas_delete_admin_arena
on public.reservas
for delete
to authenticated
using (
  exists (
    select 1
    from public.usuarios_sistema usuario
    where lower(usuario.email) = lower(auth.jwt() ->> 'email')
      and usuario.ativo = true
      and (
        usuario.tipo_usuario = 'super_admin'
        or exists (
          select 1
          from public.usuarios_arenas vinculo
          where vinculo.usuario_id = usuario.id
            and vinculo.arena_id = reservas.arena_id
            and vinculo.ativo = true
            and vinculo.perfil = 'admin_arena'
        )
      )
  )
);
