import { depoimentos } from "./landingData";

export default function Depoimentos() {
  return (
    <section className="landing-section landing-testimonials" aria-labelledby="depoimentos-title">
      <div className="landing-section-heading">
        <span>Depoimentos</span>
        <h2 id="depoimentos-title">Percepções de quem vive a operação de perto.</h2>
      </div>

      <div className="landing-testimonial-grid">
        {depoimentos.map((depoimento) => (
          <figure className="landing-testimonial-card" key={depoimento.author}>
            <blockquote>{depoimento.quote}</blockquote>
            <figcaption>
              <strong>{depoimento.author}</strong>
              <span>{depoimento.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
