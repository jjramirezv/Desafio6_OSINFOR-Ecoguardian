// Endpoints de estado del backend (Sprint 1).
// GET /health              -> salud del servicio
// GET /demo/backend-summary -> resumen tecnico para la demo

import { httpClient } from './httpClient.js';

export const healthApi = {
  /** Salud simple del servicio. */
  health: () => httpClient.get('/health'),

  /** Resumen tecnico del backend (proyecto, modulos, disclaimer). */
  backendSummary: () => httpClient.get('/demo/backend-summary'),
};
