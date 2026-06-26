import { beneficios } from "./landingData";

export default function Beneficios() {
  return (
    <section className="landing-section landing-benefits" aria-labelledby="beneficios-title">
      <div className="landing-benefits-copy">
        <span className="landing-eyebrow">Benefícios</span>
        <h2 id="beneficios-title">Mais controle para o gestor e menos atrito para o cliente.</h2>
        <p>
          Uma operação mais clara melhora atendimento, reduz erros e ajuda a arena
          vender horários com mais consistência.
        </p>
      </div>

      <ul className="landing-benefit-list">
        {beneficios.map((beneficio) => (
          <li key={beneficio}>{beneficio}</li>
        ))}
      </ul>
    </section>
  );
}
