const NAV_ITEMS = [
  { key: 'dashboard', label: 'Panel General', icon: 'PG' },
  { key: 'import', label: 'Conector / Lotes', icon: 'CL' },
  { key: 'traceability', label: 'Trazabilidad', icon: 'TR' },
];

const NAV_LABELS = {
  dashboard: 'PRINCIPAL',
  import: 'OPERACIONES',
  traceability: 'CONSULTAS',
};

export default function Sidebar({ current, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <img src="/images/logo-osinfor-blanco.png" alt="OSINFOR" className="app-sidebar__logo-img" />
        <span className="app-sidebar__brand-text">
          <span className="app-sidebar__brand-name">OSINFOR</span>
          <span className="app-sidebar__brand-sub">Huella Legal Forestal</span>
        </span>
      </div>

      {(() => {
        let lastLabel = '';
        return (
          <nav className="app-nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              const showLabel = NAV_LABELS[item.key] !== lastLabel;
              lastLabel = NAV_LABELS[item.key];
              return (
                <span key={item.key}>
                  {showLabel && NAV_LABELS[item.key] && (
                    <span className="app-nav__label">{NAV_LABELS[item.key]}</span>
                  )}
                  <button
                    type="button"
                    className={`app-nav__item ${current === item.key ? 'is-active' : ''}`}
                    onClick={() => onNavigate(item.key)}
                  >
                    <span className="app-nav__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                </span>
              );
            })}
          </nav>
        );
      })()}

      <p className="app-sidebar__footer">
        Verificación técnica de trazabilidad y consistencia documental. No certifica legalidad.
      </p>
    </aside>
  );
}

export { NAV_ITEMS };
