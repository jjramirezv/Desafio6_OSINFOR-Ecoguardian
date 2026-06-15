export default function EmptyState({
  icon = '-',
  title,
  message,
  variant = 'empty',
  action,
}) {
  return (
    <div className={`state state--${variant}`}>
      <span className="state__icon">{variant === 'error' ? '!' : icon}</span>
      {title && <strong>{title}</strong>}
      {message && <span className="text-sm">{message}</span>}
      {action}
    </div>
  );
}
