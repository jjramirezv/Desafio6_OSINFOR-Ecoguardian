// Endpoints del conector interoperable / lotes de importacion (Sprint 2).
// Cubre el flujo completo: crear -> normalizar -> persistir -> proyectar,
// mas las consultas de resumen, registros fuente, errores y operativos.

import { httpClient } from './httpClient.js';

export const importBatchApi = {
  // --- Flujo de procesamiento ---
  create: (body) => httpClient.post('/import-batches', body),

  normalizeDemo: (id, body) =>
    httpClient.post(`/import-batches/${id}/normalize-demo`, body),

  persist: (id) => httpClient.post(`/import-batches/${id}/persist`),

  project: (id) => httpClient.post(`/import-batches/${id}/project`),

  projectOperational: (id) =>
    httpClient.post(`/import-batches/${id}/project-operational`),

  // --- Consultas ---
  summary: (id) => httpClient.get(`/import-batches/${id}/summary`),

  sourceRecords: (id) => httpClient.get(`/import-batches/${id}/source-records`),

  errors: (id) => httpClient.get(`/import-batches/${id}/errors`),

  operationalRecords: (id) =>
    httpClient.get(`/import-batches/${id}/operational-records`),
};

// Cuerpos demo fijos solicitados por el reto. El batch_code lleva timestamp
// para evitar colisiones de unicidad al re-ejecutar la demo.
export function buildDemoBatchBody() {
  return {
    organization_id: 1,
    source_system_id: 4,
    batch_code: `IMP-DEMO-FRONTEND-${Date.now()}`,
    name: 'Importación demo frontend',
    import_type: 'LIBRO_OPERACIONES_TALA',
    source_file_name: 'demo_frontend.xlsx',
    source_file_path: 'imports/demo_frontend.xlsx',
    metadata: { demo: true, frontend: true },
  };
}

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
