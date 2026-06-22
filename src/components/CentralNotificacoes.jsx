import { useState } from "react";
import { Button, Drawer, EmptyState } from "./ui";

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
      <Button
        type="button"
        className="notifications-button"
        onClick={() => setAberta((valor) => !valor)}
        aria-expanded={aberta}
        aria-label="Abrir notificações"
      >
        <span aria-hidden="true">!</span>
        {quantidade > 0 && (
          <span className="notifications-badge">{quantidade}</span>
        )}
      </Button>

      {aberta && (
        <div className="notifications-layer">
          <Button
            type="button"
            className="notifications-backdrop"
            onClick={() => setAberta(false)}
            aria-label="Fechar notificações"
          />

          <Drawer className="notifications-panel">
            <div className="notifications-header">
              <strong>Notificações</strong>
              <Button type="button" onClick={() => setAberta(false)}>
                Fechar
              </Button>
            </div>

            {quantidade === 0 ? (
              <EmptyState className="notifications-empty">
                Nenhuma solicitação pendente.
              </EmptyState>
            ) : (
              <div className="notifications-list">
                {notificacoes.map((reserva) => (
                  <article className="notification-item" key={reserva.id}>
                    <strong>{reserva.cliente || "Cliente sem nome"}</strong>
                    <span>{formatarDataBR?.(reserva.data) || reserva.data}</span>
                    <span>{reserva.horario}</span>
                    <small>Solicitou reserva</small>

                    <div className="notification-actions">
                      <Button
                        type="button"
                        onClick={() => onConfirmar?.(reserva)}
                        variant="primary"
                      >
                        Confirmar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onRecusar?.(reserva)}
                      >
                        Recusar
                      </Button>
                      {reserva.telefone && (
                        <Button
                          as="a"
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
                        </Button>
                      )}
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

function criarLinkWhatsAppCliente({ nome, telefone, data, horario }) {
  const mensagem = [
    `Ola, ${nome || "tudo bem"}.`,
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
