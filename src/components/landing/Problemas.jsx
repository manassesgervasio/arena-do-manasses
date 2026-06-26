import { problemas } from "./landingData";

export default function Problemas() {
  return (
    <section className="landing-section landing-problems" aria-labelledby="problemas-title">
      <div className="landing-section-heading">
        <span>O problema</span>
        <h2 id="problemas-title">A operação da arena não precisa depender de improviso.</h2>
        <p>
          O ArenaBase foi pensado para reduzir ruído, perda de informação e
          retrabalho em rotinas que costumam ficar espalhadas.
        </p>
      </div>

      <div className="landing-problem-grid">
        {problemas.map((problema) => (
          <article className="landing-problem-card" key={problema}>
            <span aria-hidden="true" />
            <h3>{problema}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
