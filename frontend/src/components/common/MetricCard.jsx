import Badge from './Badge.jsx';

export default function MetricCard({
  title,
  value,
  detail,
  status,
  variant,
  accent = false,
}) {
  return (
    <article className={`metric-card ${accent ? 'metric-card--accent' : ''}`}>
      <div className="metric-card__header">
        <span className="metric-card__title">{title}</span>
        {status && (
          <Badge status={status} variant={variant}>
            {status}
          </Badge>
        )}
      </div>
      <div className="metric-card__value">{value}</div>
      {detail && <p className="metric-card__detail">{detail}</p>}
    </article>
  );
}
