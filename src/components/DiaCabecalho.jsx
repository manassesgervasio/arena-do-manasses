export default function DiaCabecalho({
  diaSemana,
  dataFormatada,
  totalDia,
  jogosDia,
}) {
  const dataCurta = dataFormatada.split("/").slice(0, 2).join("/");

  return (
    <div className="dia-cabecalho" style={cabecalho}>
      <div className="dia-cabecalho-linha">
        <span className="dia-cabecalho-semana">{diaSemana}</span>
        <span className="dia-cabecalho-data">{dataCurta}</span>
      </div>

      <div className="dia-cabecalho-resumo">
        <span>R$ {Number(totalDia || 0).toLocaleString("pt-BR")} hoje</span>
        <span className="dia-cabecalho-separador">{"\u2022"}</span>
        <span>{jogosDia} jogos</span>
      </div>
    </div>
  );
}

const cabecalho = {
  background: "white",
  color: "#0f172a",
  padding: "6px 7px",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "13px",
  position: "sticky",
  top: "8px",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.09)",
  zIndex: 100,
};
