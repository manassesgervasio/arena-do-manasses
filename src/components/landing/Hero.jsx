import { navItems } from "./landingData";

export default function Hero({ onEntrar, onBuscarArenas }) {
  return (
    <header className="landing-hero">
      <nav className="landing-nav" aria-label="Navegacao principal">
        <a className="landing-brand" href="#inicio" aria-label="ArenaBase">
          ArenaBase
        </a>
        <div className="landing-nav-links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <button className="landing-login-button" type="button" onClick={onEntrar}>
          Entrar
        </button>
      </nav>

      <section className="landing-hero-content" id="inicio" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">Sistema premium para arenas esportivas</span>
          <h1 id="landing-title">
            ArenaBase organiza sua agenda, reservas e financeiro em um s&oacute; painel.
          </h1>
          <p>
            Uma experi&ecirc;ncia profissional para vender hor&aacute;rios, atender clientes,
            controlar mensalistas e acompanhar a opera&ccedil;&atilde;o da arena com clareza.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-primary-action" href="#planos">
              Conhecer planos
            </a>
            <button className="landing-secondary-action" type="button" onClick={onBuscarArenas}>
              Ver agendas p&uacute;blicas
            </button>
          </div>
        </div>

        <div className="landing-hero-visual" aria-label="Previa do painel ArenaBase">
          <div className="landing-device-stage">
            <div className="landing-laptop">
              <div className="landing-device-screen">
                <div className="landing-screen-label">Screenshot do painel desktop</div>
                <div className="landing-screen-dashboard" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="landing-laptop-base" />
            </div>

            <div className="landing-phone">
              <div className="landing-phone-speaker" />
              <div className="landing-phone-screen">
                <div className="landing-screen-label">Screenshot mobile</div>
                <div className="landing-phone-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </header>
  );
}
