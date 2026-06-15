import { httpClient } from './httpClient.js';

export const legalFootprintApi = {
  show: (id) => httpClient.get(`/import-batches/${id}/legal-footprint`),
  summary: (id) =>
    httpClient.get(`/import-batches/${id}/legal-footprint/summary`),
};
