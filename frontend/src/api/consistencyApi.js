import { httpClient } from './httpClient.js';

function buildQuery(filters = {}) {
  const params = new URLSearchParams();

  ['severity', 'status', 'alert_type'].forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim());
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const consistencyApi = {
  runConsistency: (id) =>
    httpClient.post(`/import-batches/${id}/run-consistency`),

  alerts: (id, filters) =>
    httpClient.get(`/import-batches/${id}/alerts${buildQuery(filters)}`),

  showAlert: (id) => httpClient.get(`/consistency-alerts/${id}`),

  updateStatus: (id, status) =>
    httpClient.patch(`/consistency-alerts/${id}/status`, { status }),
};
