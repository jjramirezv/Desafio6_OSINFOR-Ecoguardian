import { httpClient } from './httpClient.js';

export const snapshotApi = {
  createSnapshot: (id) =>
    httpClient.post(`/import-batches/${id}/legal-footprint/snapshot`),

  verify: (verificationCode) =>
    httpClient.get(
      `/legal-footprints/verify/${encodeURIComponent(verificationCode)}`
    ),

  backendSummary: () => httpClient.get('/demo/backend-summary'),
};
