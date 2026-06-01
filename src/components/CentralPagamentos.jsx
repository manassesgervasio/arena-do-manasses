import { useState } from "react";

export default function CentralPagamentos({
  pendencias = [],
  onMarcarPago,
  onIrParaReserva,
  formatarDataBR,
  moeda,
}) {
  const [aberta, setAberta] = useState(false);
  const quantidade = pendencias.length;

  return (
    <div className="notifications-wrap payments-wrap">
      <button
        type="button"
        className="notifications-button payments-button"
        onClick={() => setAberta((valor) => !valor)}
        aria-expanded={aberta}
        aria-label="Abrir pendências de pagamento"
      >
        <span aria-hidden="true">💰</span>
        {quantidade > 0 && (
          <span className="notifications-badge payments-badge">
            {quantidade}
          </span>
        )}
      </button>

      {aberta && (
        <div className="notifications-layer">
          <button
            type="button"
            className="notifications-backdrop"
            onClick={() => setAberta(false)}
            aria-label="Fechar pendências de pagamento"
          />

          <aside className="notifications-panel payments-panel">
            <div className="notifications-header">
              <strong>Pendências de Pagamento</strong>
              <button type="button" onClick={() => setAberta(false)}>
                ×
              </button>
            </div>

            {quantidade === 0 ? (
              <div className="notifications-empty">
                Nenhuma pendência de pagamento.
              </div>
            ) : (
              <div className="notifications-list">
                {pendencias.map((reserva) => (
                  <article className="notification-item" key={reserva.id}>
                    <strong>{reserva.cliente || "Cliente sem nome"}</strong>
                    <span>{formatarDataBR?.(reserva.data) || reserva.data}</span>
                    <span>{reserva.horario}</span>
                    <span>{moeda?.(Number(reserva.valor || 0)) || `R$ ${reserva.valor || 0}`}</span>
                    <small>Status atual: {reserva.status}</small>

                    <div className="notification-actions">
                      <button
                        type="button"
                        onClick={() => onMarcarPago?.(reserva)}
                      >
                        Marcar como Pago
                      </button>
                      {reserva.telefone && (
                        <a
                          href={criarLinkWhatsAppPagamento({
                            nome: reserva.cliente,
                            telefone: reserva.telefone,
                            data: formatarDataBR?.(reserva.data) || reserva.data,
                            horario: reserva.horario,
                            valor: moeda?.(Number(reserva.valor || 0)) || `R$ ${reserva.valor || 0}`,
                          })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onIrParaReserva?.(reserva);
                          setAberta(false);
                        }}
                      >
                        Ir para horário
                      </button>
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

function criarLinkWhatsAppPagamento({ nome, telefone, data, horario, valor }) {
  const mensagem = [
    `Olá, ${nome || "tudo bem"}. Identificamos que sua reserva ainda está pendente de pagamento.`,
    "",
    `Data: ${data || ""}`,
    `Horário: ${horario || ""}`,
    `Valor: ${valor || "R$ 0"}`,
    "",
    "Pode nos enviar o comprovante por aqui?",
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
