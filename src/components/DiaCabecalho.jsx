export default function DiaCabecalho({
  diaSemana,
  dataFormatada,
  totalDia,
  jogosDia,
  moeda,
}) {
  return (
    <div className="dia-cabecalho" style={cabecalho}>
      <div className="dia-cabecalho-semana">{diaSemana}</div>
      <div
        className="dia-cabecalho-data"
        style={{ marginTop: "4px", fontSize: "12px" }}
      >
        {dataFormatada}
      </div>

      <div
        className="dia-cabecalho-resumo"
        style={{
          marginTop: "4px",
          fontWeight: "bold",
          color: "#86efac",
          fontSize: "12px",
          lineHeight: "14px",
          wordBreak: "break-word",
        }}
      >
        {moeda(totalDia)}
        <div
          className="dia-cabecalho-jogos"
          style={{ fontSize: "11px", marginTop: "2px" }}
        >
          {jogosDia} jogos
        </div>
      </div>
    </div>
  );
}

const cabecalho = {
  background: "#020617",
  color: "white",
  padding: "10px 6px",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "14px",
  position: "sticky",
  top: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  zIndex: 100,
};
