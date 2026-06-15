import KvGroup from './KvGroup.jsx';

export default function SummaryCard({
  title,
  subtitle,
  metrics = [],
  items = [],
  footer,
  accent,
  className = '',
}) {
  return (
    <div className={`summary-card${accent ? ' summary-card--accent' : ''} ${className}`.trim()}>
      {(title || subtitle) && (
        <div className="summary-card__header">
          {title && <h3 className="summary-card__title">{title}</h3>}
          {subtitle && <p className="summary-card__subtitle">{subtitle}</p>}
        </div>
      )}
      {metrics.length > 0 && (
        <div className="summary-card__metrics">
          {metrics.map((m, idx) => (
            <div key={idx} className="summary-card__metric">
              <span
                className="summary-card__metric-value"
                style={m.color ? { '--mc': m.color } : undefined}
              >
                {m.value}
              </span>
              <span className="summary-card__metric-label">{m.label}</span>
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && <KvGroup items={items} />}
      {footer && <div className="summary-card__footer">{footer}</div>}
    </div>
  );
}
