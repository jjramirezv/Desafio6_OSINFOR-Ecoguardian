// Contenedor de superficie reutilizable. Acepta un titulo opcional y acciones.

export default function Card({
  title,
  actions,
  accent = false,
  className = '',
  children,
}) {
  const classes = ['card', accent ? 'card--accent' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes}>
      {(title || actions) && (
        <div className="section-header">
          {title && <h2 className="card__title">{title}</h2>}
          {actions && <div className="section-header__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
