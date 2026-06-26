import { navItems } from "./landingData";

export default function Footer({ onEntrar }) {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-brand">
        <strong>ArenaBase</strong>
        <p>Sistema comercial para gest&atilde;o de agendas, reservas e financeiro de arenas.</p>
      </div>

      <div className="landing-footer-columns">
        <nav aria-label="Links do rodape">
          <span>Produto</span>
          {navItems.slice(0, 2).map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <nav aria-label="Links comerciais">
          <span>Comercial</span>
          {navItems.slice(2).map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <button type="button" onClick={onEntrar}>
            Entrar
          </button>
        </nav>
      </div>
    </footer>
  );
}
