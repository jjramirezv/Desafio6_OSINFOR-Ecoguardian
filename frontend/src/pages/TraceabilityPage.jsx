import { useEffect, useMemo } from 'react';
import { useTraceability } from '../hooks/useTraceability.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import GraphViewer from '../components/domain/GraphViewer.jsx';
import TimelineView from '../components/domain/TimelineView.jsx';
import NodeInspector from '../components/domain/NodeInspector.jsx';
import SearchNodeBar from '../components/domain/SearchNodeBar.jsx';
import { NodesTable, EdgesTable } from '../components/domain/TraceGraphTable.jsx';

export default function TraceabilityPage({ initialBatchId = '' }) {
  const {
    graph,
    timeline,
    searchResults,
    neighbors,
    selectedNode,
    error,
    loadGraph,
    loadTimeline,
    debouncedSearch,
    loadNeighbors,
    clearNeighbors,
    clearSearch,
    reset,
    isLoading,
  } = useTraceability();

  useEffect(() => {
    if (initialBatchId) {
      loadGraph(initialBatchId);
      loadTimeline(initialBatchId);
    }
  }, [initialBatchId, loadGraph, loadTimeline]);

  function handleBatchSelect(batchId) {
    reset();
    loadGraph(batchId);
    loadTimeline(batchId);
  }

  function handleNodeSelect(node) {
    loadNeighbors(node);
  }

  function handleTimelineNodeSelect(node) {
    loadNeighbors(node);
  }

  const neighborNodeIds = useMemo(() => {
    if (!neighbors) return null;
    const ids = [];
    if (neighbors.incoming) ids.push(...neighbors.incoming.map((n) => n.id || n.node_id));
    if (neighbors.outgoing) ids.push(...neighbors.outgoing.map((n) => n.id || n.node_id));
    if (neighbors.neighbors) ids.push(...neighbors.neighbors.map((n) => n.id || n.node_id));
    if (selectedNode) ids.push(selectedNode.id);
    return ids;
  }, [neighbors, selectedNode]);

  const graphBusy = isLoading('graph');
  const timelineBusy = isLoading('timeline');

  return (
    <>
      <SectionHeader
        title="Trazabilidad y grafo de evidencia"
        subtitle="Visualiza el grafo por lote, explora la cronología de eventos, busca nodos e inspecciona sus relaciones."
      >
        <Button
          variant="ghost"
          onClick={reset}
          disabled={isLoading('graph') || isLoading('timeline')}
        >
          Limpiar
        </Button>
      </SectionHeader>

      {error && (
        <EmptyState
          variant="error"
          title="Error consultando trazabilidad"
          message={error.message}
        />
      )}

      <div className="traceability">
        <div className="traceability__search">
          <Card title="Cargar lote" compact>
            <div className="traceability__batch-form">
              <BatchSelector onSelect={handleBatchSelect} />
            </div>
          </Card>
          <Card title="Buscar nodos" compact>
            <SearchNodeBar
              results={searchResults}
              onSearch={debouncedSearch}
              onSelect={handleNodeSelect}
              loading={isLoading('search')}
            />
          </Card>
        </div>

        <div className="traceability__main">
          <Card
            title="Grafo por lote"
            className="traceability__graph-card"
            actions={
              graph && (
                <span className="text-sm muted">
                  {graph.nodes?.length || 0} nodos · {graph.edges?.length || 0} relaciones
                </span>
              )
            }
          >
            {graphBusy ? (
              <div className="state">
                <div className="spinner" />
                <span className="text-sm">Cargando grafo…</span>
              </div>
            ) : graph ? (
              <GraphViewer
                nodes={graph.nodes || []}
                edges={graph.edges || []}
                selectedNode={selectedNode}
                neighborNodeIds={neighborNodeIds}
                onSelect={handleNodeSelect}
              />
            ) : (
              <EmptyState
                title="Sin grafo cargado"
                message="Ingresa un ID de lote proyectado para visualizar el subgrafo."
              />
            )}
          </Card>

          <div className="traceability__sidebar">
            <Card title="Inspector de nodo">
              <NodeInspector
                node={selectedNode}
                neighbors={neighbors}
                onSelect={handleNodeSelect}
                onClose={clearNeighbors}
              />
            </Card>

            <Card title="Timeline">
              {timelineBusy ? (
                <div className="state">
                  <div className="spinner" />
                  <span className="text-sm">Cargando timeline…</span>
                </div>
              ) : (
                <TimelineView
                  events={timeline}
                  onSelect={handleTimelineNodeSelect}
                />
              )}
            </Card>
          </div>
        </div>

        {neighbors && (
          <Card
            title="Vecinos del nodo"
            actions={
              <Button variant="ghost" size="sm" onClick={clearNeighbors}>
                Cerrar
              </Button>
            }
          >
            <NodesTable
              nodes={[neighbors.node, ...(neighbors.neighbors || [])].filter(Boolean)}
              selectedId={selectedNode?.id}
              onSelect={handleNodeSelect}
            />
          </Card>
        )}
      </div>
    </>
  );
}

function BatchSelector({ onSelect }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const id = form.get('batchId');
    if (id) onSelect(id);
  };

  return (
    <form className="row" onSubmit={handleSubmit}>
      <label className="field" style={{ flex: 1 }}>
        <input
          name="batchId"
          type="text"
          placeholder="ID de lote (ej. 1)"
          required
        />
      </label>
      <Button type="submit">Cargar</Button>
    </form>
  );
}
