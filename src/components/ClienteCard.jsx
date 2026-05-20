export default function ClienteCard({ cliente, index, formatarDataBR, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        transition: "0.2s",
        background:
          cliente.pendente > 0
            ? "#3f1d1d"
            : "#1e293b",
        borderRadius: "14px",
        padding: "12px",
        border:
          cliente.pendente > 0
            ? "1px solid #ef4444"
            : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "16px",
        }}
      >
        {index === 0 && "🥇"}
        {index === 1 && "🥈"}
        {index === 2 && "🥉"}

        {cliente.nome}
      </h3>

      <p>{cliente.telefone || "Sem telefone"}</p>
      {cliente.telefone && (
        <a
          href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            marginTop: "8px",
            padding: "8px 12px",
            borderRadius: "10px",
            background: "#22c55e",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          WhatsApp
        </a>
      )}

      {cliente.pendente > 0 && (
        <div
          style={{
            marginTop: "8px",
            background: "#ef4444",
            color: "white",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "bold",
            display: "inline-block",
          }}
        >
          🔴 Inadimplente
        </div>
      )}
      <p>
        Última reserva: {formatarDataBR(cliente.ultimaReserva)}
      </p>
    </div>
  );
}
