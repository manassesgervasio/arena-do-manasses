import { navigationItems } from "../navigation";

export default function MobileNavigation() {
  return (
    <nav className="mobile-navigation" aria-label="Navegação principal">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`mobile-navigation-item${
            item.id === "agenda" ? " is-active" : ""
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
