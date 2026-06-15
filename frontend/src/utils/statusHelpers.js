// Mapea estados del backend a variantes visuales (Badge) y texto legible.
// Centraliza la semantica de color para no repetir condicionales en la UI.

/**
 * Devuelve la variante de Badge para un estado dado.
 * Variantes: success | info | warning | danger | neutral
 */
export function statusVariant(status) {
  const s = String(status || '').toUpperCase();

  switch (s) {
    // Estados sanos / completados.
    case 'OK':
    case 'READY_FOR_DEMO':
    case 'COMPLETED':
    case 'TRACEABLE':
    case 'NORMALIZED':
    case 'ACTIVE':
    case 'REVIEWED':
    case 'RESOLVED':
      return 'success';

    // Estados en curso / informativos.
    case 'PENDING':
    case 'PROCESSING':
    case 'IN_PROGRESS':
    case 'OPEN':
    case 'INFO':
      return 'info';

    // Estados con observaciones (no son fallo duro).
    case 'COMPLETED_WITH_ERRORS':
    case 'OBSERVED':
    case 'INCOMPLETE':
    case 'WARNING':
      return 'warning';

    // Fallos.
    case 'ERROR':
    case 'FAILED':
    case 'CRITICAL':
      return 'danger';

    case 'DISMISSED':
      return 'neutral';

    default:
      return 'neutral';
  }
}

/** Estado legible para mostrar (mantiene el valor del backend, sin inventar). */
export function statusLabel(status) {
  if (status === null || status === undefined || status === '') return '—';
  return String(status);
}

// Estados de ejecucion de cada paso del flujo (uso interno del workflow).
export const RUN = {
  IDLE: 'idle',
  RUNNING: 'running',
  OK: 'ok',
  ERROR: 'error',
};
