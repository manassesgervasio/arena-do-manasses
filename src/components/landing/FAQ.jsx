import { perguntas } from "./landingData";

export default function FAQ() {
  return (
    <section className="landing-section landing-faq" id="faq" aria-labelledby="faq-title">
      <div className="landing-section-heading">
        <span>FAQ</span>
        <h2 id="faq-title">Perguntas frequentes</h2>
      </div>

      <div className="landing-faq-list">
        {perguntas.map((pergunta) => (
          <details key={pergunta.question}>
            <summary>{pergunta.question}</summary>
            <p>{pergunta.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
