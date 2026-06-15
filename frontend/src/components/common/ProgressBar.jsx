export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  color,
  size = 'md',
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 100;
  const barColor =
    color ||
    (pct >= 80
      ? 'var(--c-osinfor-verde)'
      : pct >= 50
        ? 'var(--c-osinfor-ambar)'
        : 'var(--c-osinfor-coral)');

  return (
    <div className={`progress-bar progress-bar--${size}`}>
      {label && (
        <div className="progress-bar__header">
          <span className="progress-bar__label">{label}</span>
          <span className="progress-bar__pct" style={{ color: barColor }}>
            {pct}%
          </span>
        </div>
      )}
      <div className="progress-bar__track">
        <div
          className="progress-bar__fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
