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
  onAlugarComoAvulso,
  onLimpar,
}) {
  const [mostrandoAluguelAvulso, setMostrandoAluguelAvulso] = useState(false);
  const [salvandoAluguelAvulso, setSalvandoAluguelAvulso] = useState(false);
  const [aluguelAvulso, setAluguelAvulso] = useState({
    cliente: "",
    telefone: "",
    valor: "",
    status: "Reservado",
  });

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
  const statusIcone = mensalistaContratado
    ? "⭐"
    : statusIcones[item.status] || "⚪";
  const tipoIcone = item.tipo === "Fixo" ? "📍" : "";
  const statusClasse = String(item.status || "Livre").toLowerCase();
  const tituloResumo =
    mensalistaContratado?.nome || item.cliente || "Disponível";
  const valorResumo = item.valor ? `R$ ${item.valor}` : "";
  const cardClasse = [
    "horario-card",
    `horario-card-${statusClasse}`,
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
        background:
          mensalistaContratado
            ? "#ecfeff"
            : item.status === "Reservado"
            ? "#dbeafe"
            : item.status === "Pago"
            ? "#dcfce7"
            : item.status === "Pendente"
            ? "#fef9c3"
            : item.status === "Cancelado"
            ? "#fee2e2"
            : item.status === "Faltou"
            ? "#ffedd5"
            : "white",
        opacity: item.status === "Livre" && !mensalistaContratado ? 0.82 : 1,
        transition: "0.2s",
        border: mensalistaContratado
          ? "1px solid #0891b2"
          : "1px solid rgba(148, 163, 184, 0.32)",
        borderRadius: "14px",
        padding: compactoLivre && !expandido ? "6px 9px" : "10px",
        boxShadow:
          compactoLivre && !expandido
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
          gap: compactoLivre && !expandido ? "1px" : "6px",
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
            gap: "8px",
            color: "#475569",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          <span>
            {statusIcone} {hora.split(" - ")[0]} {tipoIcone}
          </span>
          <span aria-hidden="true">{expandido ? "▲" : "▼"}</span>
        </span>
        <strong
          style={{
            overflow: "hidden",
            color: "#0f172a",
            fontSize: compactoLivre && !expandido ? "12px" : "14px",
            lineHeight: compactoLivre && !expandido ? "15px" : "18px",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tituloResumo}
        </strong>
        {(statusVisual !== "Livre" || valorResumo) && (
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
            {valorResumo ? <span>{valorResumo}</span> : null}
          </span>
        )}
        <ReservaBadges tipo={item.tipo} />
      </button>

      {expandido && (
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
