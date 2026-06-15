import { useCallback, useRef, useState } from 'react';
import { graphApi } from '../api/graphApi.js';
import { RUN } from '../utils/statusHelpers.js';

export function useTraceability() {
  const [graph, setGraph] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [neighbors, setNeighbors] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [status, setStatus] = useState({});
  const [error, setError] = useState(null);

  const searchDebounce = useRef(null);

  const run = useCallback(async (label, action) => {
    setStatus((s) => ({ ...s, [label]: RUN.RUNNING }));
    setError(null);
    try {
      const result = await action();
      setStatus((s) => ({ ...s, [label]: RUN.OK }));
      return result;
    } catch (err) {
      setError(err);
      setStatus((s) => ({ ...s, [label]: RUN.ERROR }));
      return null;
    }
  }, []);

  const loadGraph = useCallback(async (batchId) => {
    if (!batchId) return;
    return run('graph', async () => {
      const response = await graphApi.graphByBatch(batchId);
      setGraph(response.data);
      return response;
    });
  }, [run]);

  const loadTimeline = useCallback(async (batchId) => {
    if (!batchId) return;
    return run('timeline', async () => {
      const response = await graphApi.timelineByBatch(batchId);
      setTimeline(Array.isArray(response.data) ? response.data : []);
      return response;
    });
  }, [run]);

  const searchNodes = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }
    return run('search', async () => {
      const response = await graphApi.search(query);
      setSearchResults(Array.isArray(response.data) ? response.data : []);
      return response;
    });
  }, [run]);

  const debouncedSearch = useCallback((query) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounce.current = setTimeout(() => {
      searchNodes(query);
    }, 300);
  }, [searchNodes]);

  const loadNeighbors = useCallback(async (node) => {
    if (!node?.id) return;
    return run('neighbors', async () => {
      const response = await graphApi.neighbors(node.id);
      setNeighbors(response.data);
      setSelectedNode(node);
      return response;
    });
  }, [run]);

  const clearNeighbors = useCallback(() => {
    setNeighbors(null);
    setSelectedNode(null);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  const reset = useCallback(() => {
    setGraph(null);
    setTimeline([]);
    setSearchResults([]);
    setNeighbors(null);
    setSelectedNode(null);
    setStatus({});
    setError(null);
  }, []);

  const isLoading = useCallback(
    (label) => status[label] === RUN.RUNNING,
    [status]
  );

  const isOk = useCallback(
    (label) => status[label] === RUN.OK,
    [status]
  );

  return {
    graph,
    timeline,
    searchResults,
    neighbors,
    selectedNode,
    status,
    error,
    loadGraph,
    loadTimeline,
    searchNodes,
    debouncedSearch,
    loadNeighbors,
    clearNeighbors,
    clearSearch,
    reset,
    isLoading,
    isOk,
  };
}
