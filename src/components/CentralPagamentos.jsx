import { useState } from "react";
import { Badge, Button, Drawer, EmptyState } from "./ui";

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
        aria-label={`Abrir pend\u00eancias de pagamento`}
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
            aria-label={`Fechar pend\u00eancias de pagamento`}
          />

          <Drawer className="notifications-panel payments-panel">
            <div className="notifications-header payments-header">
              <div className="payments-header-title">
                <span className="payments-header-icon" aria-hidden="true">
                  !
                </span>
                <div>
                  <strong>
                    <span className="payments-title-desktop">
                      Pend&ecirc;ncias de pagamento
                    </span>
                    <span className="payments-title-mobile">
                      Pend&ecirc;ncias
                    </span>
                  </strong>
                  {quantidade > 0 && (
                    <span className="payments-header-count">
                      <span className="payments-count-desktop">
                        {quantidade} pend&ecirc;ncia
                        {quantidade === 1 ? "" : "s"}
                      </span>
                      <span className="payments-count-mobile">{quantidade}</span>
                    </span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                className="payments-close-button"
                onClick={() => setAberta(false)}
              >
                <span className="payments-close-desktop">Fechar</span>
                <span className="payments-close-mobile" aria-hidden="true">
                  X
                </span>
              </Button>
            </div>

            {quantidade === 0 ? (
              <EmptyState className="notifications-empty">
                Nenhuma pend&ecirc;ncia de pagamento.
              </EmptyState>
            ) : (
              <div className="notifications-list">
                {pendencias.map((reserva) => (
                  <article
                    className="notification-item payments-item"
                    key={reserva.id}
                  >
                    <div className="payments-item-main">
                      <div className="payments-item-identity">
                        <strong>{reserva.cliente || "Cliente sem nome"}</strong>
                        <span className="payments-date-desktop">
                          {formatarDataBR?.(reserva.data) || reserva.data}
                          {" \u00b7 "}
                          {reserva.horario}
                        </span>
                        <span className="payments-date-mobile">
                          {formatarDataMobile(
                            formatarDataBR?.(reserva.data) || reserva.data
                          )}
                          {" \u00b7 "}
                          {reserva.horario}
                        </span>
                      </div>
                      <div className="payments-item-summary">
                        <span className="payments-item-value">
                          {moeda?.(Number(reserva.valor || 0)) ||
                            `R$ ${reserva.valor || 0}`}
                        </span>
                        <Badge className="payments-status-badge" tone="warning">
                          {reserva.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="notification-actions">
                      <Button
                        type="button"
                        className="payments-action-primary"
                        onClick={() => onMarcarPago?.(reserva)}
                        variant="primary"
                      >
                        Marcar como pago
                      </Button>
                      {reserva.telefone && (
                        <Button
                          as="a"
                          className="payments-action-secondary payments-action-whatsapp"
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
                        className="payments-action-secondary payments-action-go"
                        onClick={() => {
                          onIrParaReserva?.(reserva);
                          setAberta(false);
                        }}
                      >
                        Ir para hor&aacute;rio
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

function formatarDataMobile(data) {
  const texto = String(data || "");
  const dataBR = texto.match(/^(\d{2})\/(\d{2})(?:\/\d{4})?$/);
  if (dataBR) return `${dataBR[1]}/${dataBR[2]}`;

  const dataISO = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dataISO) return `${dataISO[3]}/${dataISO[2]}`;

  return texto;
}

function criarLinkWhatsAppPagamento({ nome, telefone, data, horario, valor }) {
  const mensagem = [
    `Ola, ${nome || "tudo bem"}. Identificamos que sua reserva ainda esta pendente de pagamento.`,
    "",
    `Data: ${data || ""}`,
    `Hor\u00e1rio: ${horario || ""}`,
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
