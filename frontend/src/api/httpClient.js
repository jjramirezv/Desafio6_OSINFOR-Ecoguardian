// Cliente HTTP central del frontend de Huella Legal Forestal.
// Usa fetch nativo (sin axios) para mantener la base ligera y sin dependencias.
// Todas las llamadas al backend Laravel pasan por aqui.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8123/api';

// Disclaimer institucional unico. Se reutiliza en toda la app.
export const DISCLAIMER =
  'El sistema no certifica legalidad ni declara ilegalidad; verifica trazabilidad técnica, consistencia documental y evidencia disponible.';

/**
 * Error de API con contexto util para mostrar en la UI.
 */
export class ApiError extends Error {
  constructor(message, { status = null, path = null, payload = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
    this.payload = payload;
  }
}

/**
 * Ejecuta una peticion contra el backend y normaliza la respuesta.
 *
 * Devuelve siempre { status, data, message, meta, raw }.
 * Lanza ApiError (con mensaje legible) si hay error de red o status >= 400.
 * Nunca simula exito: si el backend falla, propaga el error.
 */
export async function request(path, { method = 'GET', body, signal } = {}) {
  const url = `${API_BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
    });
  } catch (networkError) {
    throw new ApiError(
      `No se pudo conectar con el backend (${url}). ¿Está corriendo en ${API_BASE_URL}? Detalle: ${networkError.message}`,
      { path }
    );
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Error HTTP ${response.status} en ${path}`;
    throw new ApiError(message, {
      status: response.status,
      path,
      payload,
    });
  }

  // El backend envuelve casi todo en { data, message, meta }.
  return {
    status: response.status,
    data: payload?.data ?? payload,
    message: payload?.message ?? null,
    meta: payload?.meta ?? null,
    raw: payload,
  };
}

// Atajos por verbo para mantener las APIs de dominio legibles.
export const httpClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    request(path, { ...options, method: 'POST', body }),
};
