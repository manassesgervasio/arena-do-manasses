export function isSuperAdmin(usuarioAtual) {
  return usuarioAtual?.tipo_usuario === "super_admin";
}

export function canAccessPainelSaaS(usuarioAtual) {
  return isSuperAdmin(usuarioAtual);
}

export function canAccessUsuariosArena(usuarioAtual, perfilAtual) {
  return isSuperAdmin(usuarioAtual) || perfilAtual === "admin_arena";
}

export function canAccessFinanceiro(usuarioAtual, perfilAtual) {
  return (
    isSuperAdmin(usuarioAtual) ||
    ["admin_arena", "gerente", "financeiro"].includes(perfilAtual)
  );
}

export function canAccessMensalistas(usuarioAtual, perfilAtual) {
  return (
    isSuperAdmin(usuarioAtual) ||
    ["admin_arena", "gerente"].includes(perfilAtual)
  );
}

export function canManageFechamento(usuarioAtual, perfilAtual) {
  return isSuperAdmin(usuarioAtual) || perfilAtual === "admin_arena";
}

export function canLimparHorarioPago(usuarioAtual, perfilAtual, permissoesLogado) {
  return (
    isSuperAdmin(usuarioAtual) ||
    perfilAtual === "admin_arena" ||
    Boolean(permissoesLogado?.podeLimparPago)
  );
}

export function canAccessAgenda() {
  return true;
}

export function canAccessClientes(usuarioAtual, perfilAtual) {
  return (
    isSuperAdmin(usuarioAtual) ||
    ["admin_arena", "gerente", "atendente"].includes(perfilAtual)
  );
}
