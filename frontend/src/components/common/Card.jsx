export default function Card({
  title,
  actions,
  accent = false,
  compact = false,
  className = '',
  children,
}) {
  const classes = ['card', accent ? 'card--accent' : '', compact ? 'card--compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes}>
      {(title || actions) && (
        <div className="card__header">
          {title && <h2 className="card__title">{title}</h2>}
          {actions && <div className="section-header__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
