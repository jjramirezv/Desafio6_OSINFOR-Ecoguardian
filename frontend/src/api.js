// Cliente HTTP minimo para el backend Laravel de Huella Legal Forestal.
// Sin axios: usa fetch nativo para mantener la demo ligera.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8123/api';

export const DISCLAIMER =
  'Esta verificación no certifica legalidad; resume trazabilidad técnica, consistencia documental y alertas registradas.';

/**
 * Ejecuta una peticion contra el backend y normaliza la respuesta.
 * Devuelve siempre { ok, status, data, raw } o lanza un Error con mensaje legible.
 */
async function request(path, { method = 'GET', body } = {}) {
  const url = `${BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (networkError) {
    throw new Error(
      `No se pudo conectar con el backend (${url}). ¿Está corriendo en ${BASE_URL}? Detalle: ${networkError.message}`
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
    throw new Error(message);
  }

  // El backend envuelve casi todo en { data, message }.
  return {
    status: response.status,
    data: payload?.data ?? payload,
    message: payload?.message ?? null,
  };
}

// ---- Endpoints del flujo de la demo ----

export const api = {
  backendSummary: () => request('/demo/backend-summary'),
  health: () => request('/health'),

  createBatch: (body) => request('/import-batches', { method: 'POST', body }),

  normalizeDemo: (id, body) =>
    request(`/import-batches/${id}/normalize-demo`, { method: 'POST', body }),

  persist: (id) => request(`/import-batches/${id}/persist`, { method: 'POST' }),

  project: (id) => request(`/import-batches/${id}/project`, { method: 'POST' }),

  projectOperational: (id) =>
    request(`/import-batches/${id}/project-operational`, { method: 'POST' }),

  runConsistency: (id) =>
    request(`/import-batches/${id}/run-consistency`, { method: 'POST' }),

  legalFootprintSummary: (id) =>
    request(`/import-batches/${id}/legal-footprint/summary`),

  snapshot: (id) =>
    request(`/import-batches/${id}/legal-footprint/snapshot`, { method: 'POST' }),

  verify: (code) => request(`/legal-footprints/verify/${code}`),

  graph: (id) => request(`/import-batches/${id}/graph`),

  alerts: (id) => request(`/import-batches/${id}/alerts`),
};

// Cuerpos demo fijos solicitados por el reto.
export const DEMO_BATCH_BODY = {
  organization_id: 1,
  source_system_id: 4,
  batch_code: `IMP-DEMO-FRONTEND-${Date.now()}`,
  name: 'Importación demo frontend',
  import_type: 'LIBRO_OPERACIONES_TALA',
  source_file_name: 'demo_frontend.xlsx',
  source_file_path: 'imports/demo_frontend.xlsx',
  metadata: { demo: true, frontend: true },
};

export const DEMO_NORMALIZE_BODY = {
  rows: [
    {
      codigo_arbol: 'ARB-DEMO-001',
      especie: 'Cedrela odorata',
      volumen_m3: '1.25',
      fecha_tala: '2026-06-14',
    },
    {
      codigo_arbol: 'ARB-DEMO-002',
      especie: 'Swietenia macrophylla',
      volumen_m3: '1.80',
      fecha_tala: '2026-06-14',
    },
  ],
};

export { BASE_URL };
