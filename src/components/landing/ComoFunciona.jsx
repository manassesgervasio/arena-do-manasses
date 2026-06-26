import { passos } from "./landingData";

export default function ComoFunciona() {
  return (
    <section
      className="landing-section landing-steps"
      id="como-funciona"
      aria-labelledby="como-funciona-title"
    >
      <div className="landing-section-heading">
        <span>Como funciona</span>
        <h2 id="como-funciona-title">Da implantação à rotina diária em três etapas.</h2>
      </div>

      <div className="landing-step-grid">
        {passos.map((passo, index) => (
          <article className="landing-step-card" key={passo.title}>
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <h3>{passo.title}</h3>
            <p>{passo.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
