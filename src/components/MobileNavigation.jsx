import { navigationItems } from "../navigation";

export default function MobileNavigation({ activeTab, onTabChange }) {
  return (
    <nav className="mobile-navigation" aria-label="Navegação principal">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onTabChange(item.id)}
          className={`mobile-navigation-item${
            item.id === activeTab ? " is-active" : ""
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
