import { useState } from "react";
import { navigationItems } from "../navigation";

export default function MobileNavigation({
  activeTab,
  items = navigationItems,
  onTabChange,
  extraItems = [],
  arenaNome,
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  function selecionarItem(item) {
    if (item.disabled) return;

    if (item.onClick) {
      item.onClick();
    } else {
      onTabChange(item.id);
    }

    setMenuAberto(false);
  }

  return (
    <>
      <button
        type="button"
        className="main-menu-trigger"
        onClick={() => setMenuAberto(true)}
        aria-label="Abrir menu principal"
      >
        <span aria-hidden="true">☰</span>
      </button>

      {menuAberto && (
        <div className="main-menu-layer">
          <button
            type="button"
            className="main-menu-backdrop"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
          />

          <nav className="mobile-navigation" aria-label="Navegacao principal">
            <div className="main-menu-header">
              <span>ARENA</span>
              <button type="button" onClick={() => setMenuAberto(false)}>
                ×
              </button>
            </div>

            {arenaNome && (
              <div className="main-menu-arena">
                <span>Arena</span>
                <strong>{arenaNome}</strong>
              </div>
            )}

            <div className="main-menu-section-label">Módulos</div>

            {[...items, ...extraItems].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selecionarItem(item)}
                disabled={item.disabled}
                className={`mobile-navigation-item${
                  item.id === activeTab ? " is-active" : ""
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
