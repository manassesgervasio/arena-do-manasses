// Futuro: integrar com WhatsApp Business API, Z-API, Evolution API ou outro provedor.
export async function notificarGestorNovaReserva({ arena, reserva, cliente }) {
  const mensagem = [
    "Nova solicitação de reserva",
    "",
    `Arena: ${arena?.nome || "Arena"}`,
    `Nome: ${cliente?.nome || reserva?.cliente || ""}`,
    `Telefone: ${cliente?.telefone || reserva?.telefone || ""}`,
    `Data: ${reserva?.data || ""}`,
    `Horário: ${reserva?.horario || ""}`,
    "Status: Pendente",
  ].join("\n");

  console.log("Notificação WhatsApp gestor preparada:", mensagem);

  return {
    sucesso: true,
    mensagem,
  };
}
