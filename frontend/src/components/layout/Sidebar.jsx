const NAV_ITEMS = [
  { key: 'dashboard', label: 'Panel general', icon: 'PG' },
  { key: 'import', label: 'Conector interoperable', icon: 'CI' },
  { key: 'traceability', label: 'Trazabilidad', icon: 'TR' },
  { key: 'footprint', label: 'Huella legal', icon: 'HL' },
  { key: 'consistency', label: 'Alertas', icon: 'AL' },
  { key: 'verification', label: 'Verificacion', icon: 'VE' },
];

export default function Sidebar({ current, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <span className="app-sidebar__logo">HL</span>
        <span className="app-sidebar__brand-text">
          <span className="app-sidebar__brand-name">Huella Legal</span>
          <span className="app-sidebar__brand-tag">Forestal</span>
        </span>
      </div>

      <nav className="app-nav" aria-label="Navegacion principal">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`app-nav__item ${current === item.key ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="app-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <p className="app-sidebar__footer">
        Verificacion tecnica de trazabilidad, consistencia documental y alertas
        registradas.
      </p>
    </aside>
  );
}

export { NAV_ITEMS };
