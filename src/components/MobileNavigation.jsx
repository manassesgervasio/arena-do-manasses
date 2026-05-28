import { navigationItems } from "../navigation";

export default function MobileNavigation({
  activeTab,
  items = navigationItems,
  onTabChange,
}) {
  return (
    <nav className="mobile-navigation" aria-label="Navegação principal">
      {items.map((item) => (
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
