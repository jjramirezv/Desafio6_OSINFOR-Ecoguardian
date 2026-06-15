// Etiqueta de estado. La variante puede pasarse directamente o derivarse de un
// status del backend mediante statusVariant().

import { statusVariant, statusLabel } from '../../utils/statusHelpers.js';

export default function Badge({
  children,
  variant,
  status,
  size = 'md',
  className = '',
}) {
  // Si llega `status`, se deriva la variante y el texto del propio estado.
  const resolvedVariant = variant || statusVariant(status);
  const content = children ?? statusLabel(status);

  const classes = [
    'badge',
    `badge--${resolvedVariant}`,
    size === 'lg' ? 'badge--lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{content}</span>;
}
