import { useState } from "react";
import ReservaBadges from "./ReservaBadges";

export default function HorarioCard({
  item,
  hora,
  mensalistaContratado,
  tipoLista,
  statusLista,
  expandido,
  compactoLivre,
  onToggleExpandido,
  onClienteChange,
  onTelefoneChange,
  onValorChange,
  onTipoChange,
  onStatusChange,
  onReservar,
  onSolicitarReservaPublica,
  onAlugarComoAvulso,
  onLimpar,
  modoPublico,
  reservaIndisponivel,
}) {
  const [mostrandoAluguelAvulso, setMostrandoAluguelAvulso] = useState(false);
  const [salvandoAluguelAvulso, setSalvandoAluguelAvulso] = useState(false);
  const [aluguelAvulso, setAluguelAvulso] = useState({
    cliente: "",
    telefone: "",
    valor: "",
    status: "Reservado",
  });
  const [solicitacaoPublica, setSolicitacaoPublica] = useState({
    nome: "",
    telefone: "",
  });
  const [enviandoSolicitacaoPublica, setEnviandoSolicitacaoPublica] =
    useState(false);

  function atualizarAluguelAvulso(campo, valor) {
    setAluguelAvulso((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function limparAluguelAvulso() {
    setAluguelAvulso({
      cliente: "",
      telefone: "",
      valor: "",
      status: "Reservado",
    });
    setMostrandoAluguelAvulso(false);
  }

  function atualizarSolicitacaoPublica(campo, valor) {
    setSolicitacaoPublica((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function salvarAluguelAvulso() {
    if (!aluguelAvulso.cliente.trim()) {
      alert("Informe o nome do cliente/time para alugar este horario.");
      return;
    }

    setSalvandoAluguelAvulso(true);

    const mensagemErro = await onAlugarComoAvulso?.(aluguelAvulso);

    setSalvandoAluguelAvulso(false);

    if (mensagemErro) {
      alert(mensagemErro);
      return;
    }

    limparAluguelAvulso();
  }

  async function confirmarSolicitacaoPublica(event) {
    event.preventDefault();

    const nome = solicitacaoPublica.nome.trim();
    const telefone = solicitacaoPublica.telefone.replace(/\D/g, "");

    if (nome.length < 3) {
      alert("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    if (telefone.length < 10) {
      alert("Informe um telefone/WhatsApp com pelo menos 10 digitos.");
      return;
    }

    setEnviandoSolicitacaoPublica(true);
    const janelaWhatsApp = window.open("", "_blank");
    if (janelaWhatsApp) {
      janelaWhatsApp.opener = null;
    }

    const resultado = await onSolicitarReservaPublica?.({
      nome,
      telefone,
    });

    setEnviandoSolicitacaoPublica(false);

    if (!resultado?.ok) {
      janelaWhatsApp?.close();
      alert(
        resultado?.mensagem ||
          "Nao foi possivel enviar a solicitacao. Tente novamente."
      );
      return;
    }

    setSolicitacaoPublica({
      nome: "",
      telefone: "",
    });
    onToggleExpandido?.();

    alert(resultado.mensagem);

    if (resultado.whatsappUrl && janelaWhatsApp) {
      janelaWhatsApp.location.href = resultado.whatsappUrl;
    } else if (resultado.whatsappUrl) {
      window.open(resultado.whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }

  const statusAvulsoLista = statusLista.filter((status) => status !== "Livre");
  const statusIcones = {
    Livre: "⚪",
    Reservado: "📌",
    Pago: "✅",
    Pendente: "⏳",
    Cancelado: "❌",
    Faltou: "⚠️",
  };
  const statusVisual = mensalistaContratado
    ? "Mensalista"
    : item.status || "Livre";
  const statusSelo = mensalistaContratado
    ? "⭐ MENSALISTA"
    : item.tipo === "Fixo"
    ? "📍 FIXO"
    : item.status === "Pago"
    ? "✅ PAGO"
    : item.status === "Pendente"
    ? "⏳ PENDENTE"
    : item.status === "Reservado"
    ? "📌 RESERVADO"
    : item.status === "Cancelado"
    ? "✕ CANCELADO"
    : item.status === "Faltou"
    ? "⚠ FALTOU"
    : "";
  const statusIcone = mensalistaContratado
    ? "⭐"
    : item.tipo === "Fixo"
    ? "📍"
    : statusIcones[item.status] || "⚪";
  const statusClasse = String(item.status || "Livre").toLowerCase();
  const tituloResumo =
    mensalistaContratado?.nome || item.cliente || "Disponível";
  const podeReservarWhatsApp =
    modoPublico && compactoLivre && !mensalistaContratado && !reservaIndisponivel;
  const cardClasse = [
    "horario-card",
    `horario-card-${statusClasse}`,
    item.tipo === "Fixo" ? "horario-card-fixo" : "",
    compactoLivre ? "horario-card-livre-compacto" : "",
    mensalistaContratado ? "horario-card-mensalista" : "",
    expandido ? "is-expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function alternarPeloCard(event) {
    if (event.target.closest("button, input, select, textarea, a")) return;

    onToggleExpandido?.();
  }

  return (
    <div
      className={cardClasse}
      onClick={alternarPeloCard}
      style={{
        background: "white",
        opacity: 1,
        transition: "0.2s",
        border: "1px solid rgba(148, 163, 184, 0.24)",
        borderRadius: "14px",
        padding: !expandido ? "4px 10px" : "10px",
        boxShadow: !expandido
          ? "0 2px 6px rgba(15, 23, 42, 0.05)"
          : "0 8px 18px rgba(15, 23, 42, 0.14)",
      }}
    >
      <button
        className="horario-compact-button horario-card-time"
        type="button"
        onClick={onToggleExpandido}
        aria-expanded={expandido}
        aria-label={`${expandido ? "Fechar" : "Abrir"} horario ${hora}`}
        style={{
          width: "100%",
          display: "grid",
          gap: !expandido ? "1px" : "6px",
          border: "none",
          background: "transparent",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
          marginBottom: expandido ? "10px" : 0,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "6px",
            color: "#475569",
            fontSize: !expandido ? "11px" : "12px",
            fontWeight: "bold",
          }}
        >
          <span className="horario-card-hour">
            {expandido ? `${statusIcone} ` : ""}
            {hora.split(" - ")[0]}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              minWidth: 0,
            }}
          >
            <span aria-hidden="true">{expandido ? "▲" : "▼"}</span>
          </span>
        </span>
        <strong
          style={{
            overflow: "hidden",
            color: "#0f172a",
            fontSize: !expandido ? "12px" : "14px",
            lineHeight: !expandido ? "14px" : "18px",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tituloResumo}
        </strong>
        {!expandido && statusSelo && (
          <span className="horario-status-pill horario-status-pill-row">
            {statusSelo}
          </span>
        )}
        {expandido && !modoPublico && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              color: "#64748b",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            <span>{statusVisual}</span>
            {item.valor ? <span>R$ {item.valor}</span> : null}
          </span>
        )}
        {expandido && !modoPublico && <ReservaBadges tipo={item.tipo} />}
      </button>

      {expandido && modoPublico && (
        <div className="horario-card-public-details">
          <div>
            <strong>{tituloResumo}</strong>
            {statusSelo && <span>{statusSelo}</span>}
          </div>

          {podeReservarWhatsApp && (
            <form
              className="public-reserva-form"
              onSubmit={confirmarSolicitacaoPublica}
            >
              <input
                placeholder="Nome"
                value={solicitacaoPublica.nome}
                onChange={(event) =>
                  atualizarSolicitacaoPublica("nome", event.target.value)
                }
                style={inputStyle}
              />
              <input
                placeholder="Telefone/WhatsApp"
                inputMode="tel"
                value={solicitacaoPublica.telefone}
                onChange={(event) =>
                  atualizarSolicitacaoPublica("telefone", event.target.value)
                }
                style={inputStyle}
              />
              <button
                className="whatsapp-reserva-button"
                type="submit"
                disabled={enviandoSolicitacaoPublica}
              >
                {enviandoSolicitacaoPublica
                  ? "Enviando..."
                  : "Reservar pelo WhatsApp"}
              </button>
            </form>
          )}
          {reservaIndisponivel && compactoLivre && (
            <span className="horario-public-unavailable">
              Indisponível para reserva
            </span>
          )}
        </div>
      )}

      {expandido && !modoPublico && (
        <div className="horario-card-form">
          {mensalistaContratado && (
            <div
              style={{
                background: "#cffafe",
                border: "1px solid #67e8f9",
                borderRadius: "10px",
                color: "#155e75",
                fontSize: "11px",
                fontWeight: "bold",
                marginBottom: "8px",
                padding: "7px",
              }}
            >
              <div>Mensalista contratado</div>
              <div
                style={{ color: "#0f172a", fontSize: "13px", marginTop: "2px" }}
              >
                {mensalistaContratado.nome}
              </div>
            </div>
          )}

          {mensalistaContratado && (
            <>
              {!mostrandoAluguelAvulso ? (
                <button
                  className="horario-action-button horario-action-full"
                  type="button"
                  onClick={() => setMostrandoAluguelAvulso(true)}
                  style={{
                    width: "100%",
                    background: "#0891b2",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    minHeight: "40px",
                  }}
                >
                  Alugar como avulso
                </button>
              ) : (
                <>
                  <input
                    placeholder="cliente/Time"
                    value={aluguelAvulso.cliente}
                    onChange={(event) =>
                      atualizarAluguelAvulso("cliente", event.target.value)
                    }
                    style={inputStyle}
                  />
                  <input
                    placeholder="Telefone"
                    value={aluguelAvulso.telefone}
                    maxLength={11}
                    onChange={(event) =>
                      atualizarAluguelAvulso("telefone", event.target.value)
                    }
                    style={{
                      ...inputStyle,
                      fontSize: "12px",
                    }}
                  />
                  <input
                    placeholder="Valor"
                    type="number"
                    value={aluguelAvulso.valor}
                    onChange={(event) =>
                      atualizarAluguelAvulso("valor", event.target.value)
                    }
                    style={inputStyle}
                  />
                  <select
                    value={aluguelAvulso.status}
                    onChange={(event) =>
                      atualizarAluguelAvulso("status", event.target.value)
                    }
                    style={inputStyle}
                  >
                    {statusAvulsoLista.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    className="horario-action-button"
                    type="button"
                    onClick={salvarAluguelAvulso}
                    disabled={salvandoAluguelAvulso}
                    style={{
                      marginRight: "6px",
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      minHeight: "40px",
                    }}
                  >
                    {salvandoAluguelAvulso ? "Salvando..." : "Salvar avulso"}
                  </button>
                  <button
                    className="horario-action-button"
                    type="button"
                    onClick={limparAluguelAvulso}
                    disabled={salvandoAluguelAvulso}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      minHeight: "40px",
                    }}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </>
          )}

          {!mensalistaContratado && (
            <>
              <input
                placeholder="cliente/Time"
                value={item.cliente}
                onChange={onClienteChange}
                disabled={item.status === "Pago"}
                style={inputStyle}
              />

              <input
                placeholder="Telefone"
                value={item.telefone}
                maxLength={11}
                onChange={onTelefoneChange}
                disabled={item.status === "Pago"}
                style={{
                  ...inputStyle,
                  fontSize: "12px",
                }}
              />

              <input
                placeholder="Valor"
                type="number"
                value={item.valor}
                onChange={onValorChange}
                disabled={item.status === "Pago"}
                style={inputStyle}
              />

              <select
                value={item.tipo || "Avulso"}
                onChange={onTipoChange}
                disabled={item.status === "Pago"}
                style={inputStyle}
              >
                {tipoLista.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
              <select
                value={item.status}
                onChange={onStatusChange}
                disabled={item.status === "Pago"}
                style={inputStyle}
              >
                {statusLista.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <button
                className="horario-action-button"
                type="button"
                onClick={onReservar}
                style={{
                  marginRight: "6px",
                  background: "#22c55e",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  minHeight: "40px",
                }}
              >
                Reservar
              </button>

              <button
                className="horario-action-button"
                type="button"
                onClick={onLimpar}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  minHeight: "40px",
                }}
              >
                Limpar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginBottom: "5px",
  padding: "6px",
  borderRadius: "7px",
  border: "1px solid #94a3b8",
  fontSize: "12px",
  minHeight: "34px",
};
