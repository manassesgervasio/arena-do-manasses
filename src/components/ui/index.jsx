function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  children,
  className = "",
  variant = "secondary",
  as: Component = "button",
  ...props
}) {
  return (
    <Component
      className={joinClasses(
        "ds-button",
        variant === "primary" && "ds-button-primary",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Card({ children, className = "", as: Component = "div", ...props }) {
  return (
    <Component className={joinClasses("ds-card", className)} {...props}>
      {children}
    </Component>
  );
}

export function Badge({ children, className = "", tone = "default", ...props }) {
  return (
    <span
      className={joinClasses(
        "ds-badge",
        tone === "success" && "ds-badge-success",
        tone === "warning" && "ds-badge-warning",
        tone === "info" && "ds-badge-info",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={joinClasses("ds-input", className)} {...props} />;
}

export function Select({ children, className = "", ...props }) {
  return (
    <select className={joinClasses("ds-select", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={joinClasses("ds-textarea", className)} {...props} />;
}

export function Modal({ children, className = "", ...props }) {
  return (
    <div className={joinClasses("ds-modal", className)} {...props}>
      {children}
    </div>
  );
}

export function Drawer({ children, className = "", ...props }) {
  return (
    <aside className={joinClasses("ds-drawer", className)} {...props}>
      {children}
    </aside>
  );
}

export function Header({ children, className = "", ...props }) {
  return (
    <header className={joinClasses("ds-header", className)} {...props}>
      {children}
    </header>
  );
}

export function Tabs({ children, className = "", ...props }) {
  return (
    <div className={joinClasses("ds-tabs", className)} {...props}>
      {children}
    </div>
  );
}

export function Navigation({ children, className = "", ...props }) {
  return (
    <nav className={joinClasses("ds-navigation", className)} {...props}>
      {children}
    </nav>
  );
}

export function EmptyState({ children = "Nenhum registro encontrado.", className = "" }) {
  return <div className={joinClasses("ds-empty", className)}>{children}</div>;
}

export function LoadingState({ children = "Carregando...", className = "" }) {
  return <div className={joinClasses("ds-loading", className)}>{children}</div>;
}
