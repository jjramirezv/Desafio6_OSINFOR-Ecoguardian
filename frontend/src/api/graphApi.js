import { httpClient } from './httpClient.js';

export const graphApi = {
  /** Grafo semilla de evidencia (Sprint 1). */
  seed: () => httpClient.get('/graph/seed'),

  /** Grafo (nodos + relaciones) proyectado de un lote. */
  graphByBatch: (batchId) => httpClient.get(`/import-batches/${batchId}/graph`),

  /** Timeline cronologico de eventos del lote. */
  timelineByBatch: (batchId) =>
    httpClient.get(`/import-batches/${batchId}/timeline`),

  /** Busqueda simple de nodos por label. */
  search: (query) =>
    httpClient.get(`/trace/search?q=${encodeURIComponent(query)}`),

  /** Vecindario (relaciones entrantes/salientes) de un nodo. */
  neighbors: (nodeId) => httpClient.get(`/trace/nodes/${nodeId}/neighbors`),
};
