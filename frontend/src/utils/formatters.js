// Funciones puras de formato reutilizables en toda la UI.

/** Hora local corta (es-PE) para el log de acciones. */
export function formatTime(date = new Date()) {
  return date.toLocaleTimeString('es-PE');
}

/** Fecha/hora legible a partir de un string ISO del backend. */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-PE');
}

/** Serializa un objeto a JSON identado, tolerante a valores no serializables. */
export function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Convierte una clave snake_case en etiqueta legible (Titulo). */
export function humanizeKey(key) {
  if (!key) return '';
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Valor numerico seguro (0 por defecto). */
export function toCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
