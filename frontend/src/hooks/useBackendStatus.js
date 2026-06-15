import { useCallback, useEffect, useState } from 'react';
import { healthApi } from '../api/healthApi.js';
import { sourceSystemsApi } from '../api/sourceSystemsApi.js';
import { graphApi } from '../api/graphApi.js';

export function useBackendStatus() {
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [sourceSystems, setSourceSystems] = useState(null);
  const [graphSeed, setGraphSeed] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [loadingSourceSystems, setLoadingSourceSystems] = useState(false);
  const [loadingGraphSeed, setLoadingGraphSeed] = useState(false);
  const [error, setError] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [sourceSystemsError, setSourceSystemsError] = useState(null);
  const [graphSeedError, setGraphSeedError] = useState(null);

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

  const loadSourceSystems = useCallback(async () => {
    setLoadingSourceSystems(true);
    setSourceSystemsError(null);
    try {
      const response = await sourceSystemsApi.list();
      setSourceSystems(response.data);
      return response;
    } catch (err) {
      setSourceSystems(null);
      setSourceSystemsError(err);
      return null;
    } finally {
      setLoadingSourceSystems(false);
    }
  }, []);

  const loadGraphSeed = useCallback(async () => {
    setLoadingGraphSeed(true);
    setGraphSeedError(null);
    try {
      const response = await graphApi.seed();
      setGraphSeed(response.data);
      return response;
    } catch (err) {
      setGraphSeed(null);
      setGraphSeedError(err);
      return null;
    } finally {
      setLoadingGraphSeed(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    checkHealth();
    loadSourceSystems();
    loadGraphSeed();
  }, [loadSummary, checkHealth, loadSourceSystems, loadGraphSeed]);

  return {
    summary,
    health,
    sourceSystems,
    graphSeed,
    loadingSummary,
    checkingHealth,
    loadingSourceSystems,
    loadingGraphSeed,
    error,
    healthError,
    sourceSystemsError,
    graphSeedError,
    loadSummary,
    checkHealth,
    loadSourceSystems,
    loadGraphSeed,
  };
}
