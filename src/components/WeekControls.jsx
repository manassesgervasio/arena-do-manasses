export default function WeekControls({
  dataBase,
  mesFiltro,
  formatarData,
  onSemanaAnterior,
  onDataChange,
  onMesFiltroChange,
  onSemanaProxima,
  onCopiarFixos,
}) {
  return (
    <div
      className="week-controls"
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "8px",
        marginTop: "25px",
        flexWrap: "wrap",
        padding: "0 10px",
      }}
    >
      <button
        className="week-control-button"
        onClick={onSemanaAnterior}
        style={botao}
      >
        ← Semana anterior
      </button>

      <input
        className="week-control-input"
        type="date"
        value={formatarData(dataBase)}
        onChange={onDataChange}
        style={inputData}
      />
      <input
        className="week-control-input"
        type="month"
        value={mesFiltro}
        onChange={onMesFiltroChange}
        style={{
          padding: "10px",
          borderRadius: "10px",
          border: "none",
          fontWeight: "bold",
          marginTop: "10px",
        }}
      />

      <button
        className="week-control-button"
        onClick={onSemanaProxima}
        style={botao}
      >
        Próxima semana →
      </button>
    </div>
  );
}

const botao = {
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputData = {
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  fontWeight: "bold",
};
