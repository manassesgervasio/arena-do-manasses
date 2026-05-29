export default function DiaCabecalho({
  diaSemana,
  dataFormatada,
  totalDia,
  jogosDia,
  moeda,
}) {
  const dataCurta = dataFormatada.split("/").slice(0, 2).join("/");

  return (
    <div className="dia-cabecalho" style={cabecalho}>
      <div className="dia-cabecalho-linha">
        <span className="dia-cabecalho-semana">{diaSemana}</span>
        <span className="dia-cabecalho-data">{dataCurta}</span>
      </div>

      <div
        className="dia-cabecalho-resumo"
        style={{
          marginTop: "3px",
          fontWeight: "bold",
          color: "#86efac",
          fontSize: "12px",
          lineHeight: "14px",
          wordBreak: "break-word",
        }}
      >
        {moeda(totalDia)} <span className="dia-cabecalho-separador">•</span>{" "}
        <span className="dia-cabecalho-jogos">{jogosDia} jogos</span>
      </div>
    </div>
  );
}

const cabecalho = {
  background: "#020617",
  color: "white",
  padding: "7px 6px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "13px",
  position: "sticky",
  top: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  zIndex: 100,
};
