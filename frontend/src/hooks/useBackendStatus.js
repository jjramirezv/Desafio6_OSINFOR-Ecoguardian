import { useCallback, useEffect, useState } from 'react';
import { healthApi } from '../api/healthApi.js';

export function useBackendStatus() {
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [error, setError] = useState(null);
  const [healthError, setHealthError] = useState(null);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const response = await healthApi.backendSummary();
      setSummary(response.data);
      return response;
    } catch (err) {
      setSummary(null);
      setError(err);
      return null;
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    setCheckingHealth(true);
    setHealthError(null);
    try {
      const response = await healthApi.health();
      setHealth(response.data);
      return response;
    } catch (err) {
      setHealth(null);
      setHealthError(err);
      return null;
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    health,
    loadingSummary,
    checkingHealth,
    error,
    healthError,
    loadSummary,
    checkHealth,
  };
}
