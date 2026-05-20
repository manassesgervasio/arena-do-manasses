export default function ClienteModal({ cliente, moeda, onClose }) {
  if (!cliente) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f172a",
          padding: "30px",
          borderRadius: "20px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflowY: "auto",
          color: "white",
        }}
      >
        <h2>
          {cliente.nome}
        </h2>

        <p>
          Telefone:{" "}
          {cliente.telefone ||
            "Sem telefone"}
        </p>

        <p>
          Jogos pagos:{" "}
          {cliente.jogos}
        </p>

        <p>
          Total pago:{" "}
          {moeda(cliente.pago)}
        </p>

        <p>
          Total pendente:{" "}
          {moeda(cliente.pendente)}
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "10px 14px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
