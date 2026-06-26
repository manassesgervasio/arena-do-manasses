export default function CTAFinal({ onEntrar }) {
  return (
    <section className="landing-final-cta" id="cta-final" aria-labelledby="cta-final-title">
      <span className="landing-eyebrow">Pr&oacute;ximo passo</span>
      <h2 id="cta-final-title">Leve uma opera&ccedil;&atilde;o mais profissional para sua arena.</h2>
      <p>
        Organize hor&aacute;rios, clientes, pagamentos e atendimento em uma experi&ecirc;ncia
        desenhada para gest&atilde;o esportiva.
      </p>
      <div className="landing-final-actions">
        <a className="landing-primary-action" href="mailto:contato@arenabase.com.br">
          Solicitar demonstra&ccedil;&atilde;o
        </a>
        <button className="landing-secondary-action" type="button" onClick={onEntrar}>
          Acessar minha conta
        </button>
      </div>
    </section>
  );
}
