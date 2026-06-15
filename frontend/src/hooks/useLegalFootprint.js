import { useCallback, useEffect, useState } from 'react';
import { legalFootprintApi } from '../api/legalFootprintApi.js';

export function useLegalFootprint(initialBatchId = '') {
  const [batchId, setBatchId] = useState(initialBatchId || '');
  const [footprint, setFootprint] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialBatchId) setBatchId(initialBatchId);
  }, [initialBatchId]);

  const run = useCallback(async (label, action) => {
    setLoading(label);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading('');
    }
  }, []);

  const loadFootprint = useCallback(
    (forcedBatchId = batchId) =>
      run('footprint', async () => {
        const response = await legalFootprintApi.show(forcedBatchId);
        setFootprint(response.data);
        return response;
      }),
    [batchId, run]
  );

  const loadSummary = useCallback(
    (forcedBatchId = batchId) =>
      run('summary', async () => {
        const response = await legalFootprintApi.summary(forcedBatchId);
        setSummary(response.data);
        return response;
      }),
    [batchId, run]
  );

  const loadAll = useCallback(async () => {
    if (!batchId) return null;
    const summaryResponse = await loadSummary(batchId);
    const footprintResponse = await loadFootprint(batchId);
    return { summaryResponse, footprintResponse };
  }, [batchId, loadFootprint, loadSummary]);

  return {
    batchId,
    setBatchId,
    footprint,
    summary,
    loading,
    error,
    loadFootprint,
    loadSummary,
    loadAll,
  };
}
