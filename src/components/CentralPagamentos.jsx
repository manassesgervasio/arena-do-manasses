import { useState } from "react";
import { Button, Drawer, EmptyState } from "./ui";

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
      <Button
        type="button"
        className="notifications-button payments-button"
        onClick={() => setAberta((valor) => !valor)}
        aria-expanded={aberta}
        aria-label="Abrir pendencias de pagamento"
      >
        <span aria-hidden="true">$</span>
        {quantidade > 0 && (
          <span className="notifications-badge payments-badge">
            {quantidade}
          </span>
        )}
      </Button>

      {aberta && (
        <div className="notifications-layer">
          <Button
            type="button"
            className="notifications-backdrop"
            onClick={() => setAberta(false)}
            aria-label="Fechar pendencias de pagamento"
          />

          <Drawer className="notifications-panel payments-panel">
            <div className="notifications-header">
              <strong>Pendencias de Pagamento</strong>
              <Button type="button" onClick={() => setAberta(false)}>
                Fechar
              </Button>
            </div>

            {quantidade === 0 ? (
              <EmptyState className="notifications-empty">
                Nenhuma pendencia de pagamento.
              </EmptyState>
            ) : (
              <div className="notifications-list">
                {pendencias.map((reserva) => (
                  <article className="notification-item" key={reserva.id}>
                    <strong>{reserva.cliente || "Cliente sem nome"}</strong>
                    <span>{formatarDataBR?.(reserva.data) || reserva.data}</span>
                    <span>{reserva.horario}</span>
                    <span>
                      {moeda?.(Number(reserva.valor || 0)) ||
                        `R$ ${reserva.valor || 0}`}
                    </span>
                    <small>Status atual: {reserva.status}</small>

                    <div className="notification-actions">
                      <Button
                        type="button"
                        onClick={() => onMarcarPago?.(reserva)}
                        variant="primary"
                      >
                        Marcar como Pago
                      </Button>
                      {reserva.telefone && (
                        <Button
                          as="a"
                          href={criarLinkWhatsAppPagamento({
                            nome: reserva.cliente,
                            telefone: reserva.telefone,
                            data: formatarDataBR?.(reserva.data) || reserva.data,
                            horario: reserva.horario,
                            valor:
                              moeda?.(Number(reserva.valor || 0)) ||
                              `R$ ${reserva.valor || 0}`,
                          })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => {
                          onIrParaReserva?.(reserva);
                          setAberta(false);
                        }}
                      >
                        Ir para horario
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Drawer>
        </div>
      )}
    </div>
  );
}

function criarLinkWhatsAppPagamento({ nome, telefone, data, horario, valor }) {
  const mensagem = [
    `Ola, ${nome || "tudo bem"}. Identificamos que sua reserva ainda esta pendente de pagamento.`,
    "",
    `Data: ${data || ""}`,
    `Horario: ${horario || ""}`,
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
