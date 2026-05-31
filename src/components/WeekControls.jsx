export default function WeekControls({
  mesFiltro,
  onMesFiltroChange,
  mostrarApenasOcupados,
  onMostrarApenasOcupadosChange,
}) {
  const mesLegivel = formatarMesLegivel(mesFiltro);

  return (
    <section className="week-controls">
      <div className="week-controls-main">
        <label className="week-month-pill">
          <span aria-hidden="true">{"\u{1F4C5}"}</span>
          <span>{mesLegivel}</span>
          <input
            className="week-month-native"
            type="month"
            value={mesFiltro}
            onChange={onMesFiltroChange}
            aria-label="Selecionar mes"
          />
        </label>

        <label className="week-occupied-switch">
          <input
            type="checkbox"
            checked={mostrarApenasOcupados}
            onChange={(event) =>
              onMostrarApenasOcupadosChange(event.target.checked)
            }
          />
          <span>Ocupados</span>
        </label>
      </div>
    </section>
  );
}

function formatarMesLegivel(mesFiltro) {
  if (!mesFiltro) return "Mes atual";

  const [ano, mes] = mesFiltro.split("-").map(Number);
  const data = new Date(ano, mes - 1, 1);
  const texto = data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
