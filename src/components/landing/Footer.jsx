import { navItems } from "./landingData";

export default function Footer({ onEntrar }) {
  return (
    <footer className="landing-footer">
      <div>
        <strong>ArenaBase</strong>
        <p>Sistema comercial para gestão de agendas, reservas e financeiro de arenas.</p>
      </div>
      <nav aria-label="Links do rodapé">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
        <button type="button" onClick={onEntrar}>
          Entrar
        </button>
      </nav>
    </footer>
  );
}
