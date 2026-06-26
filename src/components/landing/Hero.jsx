import { navItems } from "./landingData";

export default function Hero({ onEntrar, onBuscarArenas }) {
  return (
    <header className="landing-hero">
      <nav className="landing-nav" aria-label="Navegação principal">
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
            ArenaBase organiza sua agenda, reservas e financeiro em um só painel.
          </h1>
          <p>
            Uma experiência profissional para vender horários, atender clientes,
            controlar mensalistas e acompanhar a operação da arena com clareza.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-primary-action" href="#planos">
              Conhecer planos
            </a>
            <button className="landing-secondary-action" type="button" onClick={onBuscarArenas}>
              Ver agendas públicas
            </button>
          </div>
        </div>

        <div className="landing-hero-visual" aria-label="Prévia do painel ArenaBase">
          <div className="landing-product-frame">
            <div className="landing-product-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="landing-product-grid">
              <div className="landing-product-sidebar" />
              <div className="landing-product-main">
                <div className="landing-product-stat" />
                <div className="landing-product-stat" />
                <div className="landing-product-agenda">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <span key={index} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </header>
  );
}
