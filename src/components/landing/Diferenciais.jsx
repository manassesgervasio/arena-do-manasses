import { diferenciais } from "./landingData";

export default function Diferenciais() {
  return (
    <section className="landing-section landing-differentials" aria-labelledby="diferenciais-title">
      <div>
        <span className="landing-eyebrow">Diferenciais</span>
        <h2 id="diferenciais-title">Uma base feita para arena crescer com organização.</h2>
      </div>
      <div className="landing-differential-list">
        {diferenciais.map((diferencial) => (
          <article key={diferencial}>
            <h3>{diferencial}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
