const screenshots = [
  { label: "Painel desktop", device: "desktop" },
  { label: "Agenda mobile", device: "mobile" },
  { label: "Financeiro", device: "desktop" },
];

export default function Screenshots() {
  return (
    <section className="landing-section landing-screenshots" aria-labelledby="screenshots-title">
      <div className="landing-section-heading">
        <span>Produto</span>
        <h2 id="screenshots-title">Espa&ccedil;o preparado para screenshots reais do sistema.</h2>
        <p>
          Molduras reservadas para capturas oficiais da agenda, financeiro e p&aacute;gina p&uacute;blica
          quando as imagens finais forem adicionadas.
        </p>
      </div>

      <div className="landing-screenshot-grid">
        {screenshots.map((screenshot) => (
          <figure
            className={`landing-screenshot-placeholder is-${screenshot.device}`}
            key={screenshot.label}
          >
            <div className="landing-screenshot-frame" aria-hidden="true">
              <div className="landing-screenshot-empty">
                <span>Inserir screenshot real</span>
              </div>
            </div>
            <figcaption>{screenshot.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
