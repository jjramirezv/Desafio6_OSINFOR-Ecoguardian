import { httpClient } from './httpClient.js';

export const sourceSystemsApi = {
  list: () => httpClient.get('/source-systems'),
};
