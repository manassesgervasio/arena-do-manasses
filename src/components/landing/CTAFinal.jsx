export default function CTAFinal({ onEntrar }) {
  return (
    <section className="landing-final-cta" id="cta-final" aria-labelledby="cta-final-title">
      <span className="landing-eyebrow">Próximo passo</span>
      <h2 id="cta-final-title">Leve uma operação mais profissional para sua arena.</h2>
      <p>
        Organize horários, clientes, pagamentos e atendimento em uma experiência
        desenhada para gestão esportiva.
      </p>
      <div>
        <a className="landing-primary-action" href="mailto:contato@arenabase.com.br">
          Solicitar demonstração
        </a>
        <button className="landing-secondary-action" type="button" onClick={onEntrar}>
          Acessar minha conta
        </button>
      </div>
    </section>
  );
}
