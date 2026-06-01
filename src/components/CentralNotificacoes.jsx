import { useState } from "react";

export default function CentralNotificacoes({
  notificacoes = [],
  onConfirmar,
  onRecusar,
  formatarDataBR,
}) {
  const [aberta, setAberta] = useState(false);
  const quantidade = notificacoes.length;

  return (
    <div className="notifications-wrap">
      <button
        type="button"
        className="notifications-button"
        onClick={() => setAberta((valor) => !valor)}
        aria-expanded={aberta}
        aria-label="Abrir notificações"
      >
        <span aria-hidden="true">🔔</span>
        {quantidade > 0 && (
          <span className="notifications-badge">{quantidade}</span>
        )}
      </button>

      {aberta && (
        <div className="notifications-layer">
          <button
            type="button"
            className="notifications-backdrop"
            onClick={() => setAberta(false)}
            aria-label="Fechar notificações"
          />

          <aside className="notifications-panel">
            <div className="notifications-header">
              <strong>Notificações</strong>
              <button type="button" onClick={() => setAberta(false)}>
                ×
              </button>
            </div>

            {quantidade === 0 ? (
              <div className="notifications-empty">
                Nenhuma solicitação pendente.
              </div>
            ) : (
              <div className="notifications-list">
                {notificacoes.map((reserva) => (
                  <article className="notification-item" key={reserva.id}>
                    <strong>{reserva.cliente || "Cliente sem nome"}</strong>
                    <span>{formatarDataBR?.(reserva.data) || reserva.data}</span>
                    <span>{reserva.horario}</span>
                    <small>Solicitou reserva</small>

                    <div className="notification-actions">
                      <button
                        type="button"
                        onClick={() => onConfirmar?.(reserva)}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => onRecusar?.(reserva)}
                      >
                        Recusar
                      </button>
                      {reserva.telefone && (
                        <a
                          href={criarLinkWhatsAppCliente({
                            nome: reserva.cliente,
                            telefone: reserva.telefone,
                            data: formatarDataBR?.(reserva.data) || reserva.data,
                            horario: reserva.horario,
                          })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function criarLinkWhatsAppCliente({ nome, telefone, data, horario }) {
  const mensagem = [
    `Olá, ${nome || "tudo bem"}.`,
    "",
    "Estamos analisando sua solicitação de reserva.",
    "",
    `Data: ${data || ""}`,
    `Horário: ${horario || ""}`,
    "",
    "Entraremos em contato em instantes.",
  ].join("\n");

  return `https://wa.me/${normalizarTelefoneWhatsApp(
    telefone
  )}?text=${encodeURIComponent(mensagem)}`;
}

function normalizarTelefoneWhatsApp(telefone) {
  const digitos = String(telefone || "").replace(/\D/g, "");

  if (digitos.startsWith("55")) return digitos;

  return `55${digitos}`;
}
