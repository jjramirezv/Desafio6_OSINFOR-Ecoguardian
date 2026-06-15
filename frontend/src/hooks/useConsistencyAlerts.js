import { useCallback, useEffect, useState } from 'react';
import { consistencyApi } from '../api/consistencyApi.js';

export const ALERT_STATUSES = ['OPEN', 'REVIEWED', 'DISMISSED', 'RESOLVED'];
export const ALERT_SEVERITIES = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'];

export function useConsistencyAlerts(initialBatchId = '') {
  const [batchId, setBatchId] = useState(initialBatchId || '');
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    alert_type: '',
  });
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [runSummary, setRunSummary] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState('');

  useEffect(() => {
    if (initialBatchId) setBatchId(initialBatchId);
  }, [initialBatchId]);

  const run = useCallback(async (label, action) => {
    setLoading(label);
    setError(null);
    setLastMessage('');
    try {
      const response = await action();
      setLastMessage(response?.message || '');
      return response;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading('');
    }
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ severity: '', status: '', alert_type: '' });
  }, []);

  const loadAlerts = useCallback(
    (forcedBatchId = batchId) =>
      run('alerts', async () => {
        const response = await consistencyApi.alerts(forcedBatchId, filters);
        setAlerts(Array.isArray(response.data) ? response.data : []);
        return response;
      }),
    [batchId, filters, run]
  );

  const runConsistency = useCallback(
    (forcedBatchId = batchId) =>
      run('consistency', async () => {
        const response = await consistencyApi.runConsistency(forcedBatchId);
        setRunSummary(response.data);
        await loadAlerts(forcedBatchId);
        return response;
      }),
    [batchId, loadAlerts, run]
  );

  const loadAlert = useCallback(
    (alertId) =>
      run('alert-detail', async () => {
        const response = await consistencyApi.showAlert(alertId);
        setSelectedAlert(response.data);
        return response;
      }),
    [run]
  );

  const updateAlertStatus = useCallback(
    (alertId, status) =>
      run('alert-status', async () => {
        const response = await consistencyApi.updateStatus(alertId, status);
        setSelectedAlert(response.data);
        setAlerts((current) =>
          current.map((alert) =>
            alert.id === response.data.id ? response.data : alert
          )
        );
        return response;
      }),
    [run]
  );

  return {
    batchId,
    setBatchId,
    filters,
    updateFilter,
    clearFilters,
    alerts,
    selectedAlert,
    runSummary,
    loading,
    error,
    lastMessage,
    loadAlerts,
    runConsistency,
    loadAlert,
    updateAlertStatus,
  };
}
