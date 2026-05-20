export default function ResumoCards({ resumo, moeda }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "15px",
        marginTop: "30px",
      }}
    >
      <ResumoCard titulo="Faturamento" valor={moeda(resumo.faturamento)} />
      <ResumoCard titulo="Pendente" valor={moeda(resumo.pendente)} />
      <ResumoCard titulo="Jogos" valor={resumo.jogos} />
      <ResumoCard titulo="Pagos" valor={resumo.pagos} />
      <ResumoCard titulo="Reservados" valor={resumo.reservados} />
      <ResumoCard
        titulo="Mês Pago"
        valor={moeda(resumo.faturamentoMes)}
      />

      <ResumoCard
        titulo="Mês Pendente"
        valor={moeda(resumo.pendenteMes)}
      />
    </div>
  );
}

function ResumoCard({ titulo, valor }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        padding: "22px",
        borderRadius: "22px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <p style={{ color: "#cbd5e1", fontSize: "18px", margin: 0 }}>
        {titulo}
      </p>

      <h2
        style={{
          fontSize: "32px",
          color: "white",
          margin: "10px 0 0",
          wordBreak: "break-word",
          lineHeight: "36px",
        }}
      >
        {valor}
      </h2>
    </div>
  );
}
