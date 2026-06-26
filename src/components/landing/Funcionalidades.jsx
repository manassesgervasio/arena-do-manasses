import { funcionalidades } from "./landingData";

export default function Funcionalidades() {
  return (
    <section
      className="landing-section landing-features"
      id="funcionalidades"
      aria-labelledby="funcionalidades-title"
    >
      <div className="landing-section-heading">
        <span>Funcionalidades</span>
        <h2 id="funcionalidades-title">Tudo que a arena precisa para operar com padrão.</h2>
        <p>
          Recursos conectados para agenda, atendimento, clientes, mensalistas e financeiro.
        </p>
      </div>

      <div className="landing-feature-grid">
        {funcionalidades.map((funcionalidade) => (
          <article className="landing-feature-card" key={funcionalidade.title}>
            <div className="landing-feature-mark" aria-hidden="true" />
            <h3>{funcionalidade.title}</h3>
            <p>{funcionalidade.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
