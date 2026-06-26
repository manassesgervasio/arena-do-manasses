import { planos } from "./landingData";

export default function Planos() {
  return (
    <section className="landing-section landing-plans" id="planos" aria-labelledby="planos-title">
      <div className="landing-section-heading">
        <span>Planos</span>
        <h2 id="planos-title">Escolha o formato ideal para sua operação.</h2>
        <p>
          Estrutura preparada para ajustes comerciais, implantação guiada e evolução
          por perfil de arena.
        </p>
      </div>

      <div className="landing-plan-grid">
        {planos.map((plano) => (
          <article
            className={`landing-plan-card${plano.featured ? " is-featured" : ""}`}
            key={plano.name}
          >
            {plano.featured && <span className="landing-plan-badge">Mais escolhido</span>}
            <h3>{plano.name}</h3>
            <strong>{plano.price}</strong>
            <p>{plano.description}</p>
            <ul>
              {plano.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <a href="#cta-final">Solicitar contato</a>
          </article>
        ))}
      </div>
    </section>
  );
}
