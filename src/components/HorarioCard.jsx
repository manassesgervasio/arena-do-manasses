import ReservaBadges from "./ReservaBadges";

export default function HorarioCard({
  item,
  hora,
  tipoLista,
  statusLista,
  onClienteChange,
  onTelefoneChange,
  onValorChange,
  onTipoChange,
  onStatusChange,
  onReservar,
  onLimpar,
}) {
  return (
    <div
      style={{
        background:
          item.status === "Pago"
            ? "#dcfce7"
            : item.status === "Pendente"
            ? "#fef9c3"
            : item.status === "Cancelado"
            ? "#fee2e2"
            : item.status === "Faltou"
            ? "#e5e7eb"
            : "white",

        opacity: item.status === "Livre" ? 0.72 : 1,

        transform:
          item.status === "Pago"
            ? "scale(1.02)"
            : item.status === "Livre"
            ? "scale(0.98)"
            : "scale(1)",

        transition: "0.2s",
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "16px",
        padding: "12px",
        boxShadow:
          item.status === "Livre"
            ? "0 4px 12px rgba(15, 23, 42, 0.08)"
            : "0 8px 20px rgba(15, 23, 42, 0.18)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "bold",
          color: "#475569",
          marginBottom: "4px",
        }}
      >
        {hora.split(" - ")[0]}
        <ReservaBadges tipo={item.tipo} />
      </div>
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
          <option key={status}>
            {status}
          </option>
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
