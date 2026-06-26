export default function Screenshots() {
  return (
    <section className="landing-section landing-screenshots" aria-labelledby="screenshots-title">
      <div className="landing-section-heading">
        <span>Produto</span>
        <h2 id="screenshots-title">Espaço preparado para screenshots reais do sistema.</h2>
        <p>
          Blocos reservados para capturas oficiais da agenda, financeiro e página pública
          quando as imagens finais forem adicionadas.
        </p>
      </div>

      <div className="landing-screenshot-grid">
        {["Agenda interna", "Financeiro", "Agenda pública"].map((label) => (
          <figure className="landing-screenshot-placeholder" key={label}>
            <div aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
