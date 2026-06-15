import { useEffect, useMemo } from 'react';
import { useTraceability } from '../hooks/useTraceability.js';
import Card from '../components/common/Card.jsx';
<<<<<<< HEAD
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
=======
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import Timeline from '../components/common/Timeline.jsx';
import GraphSummaryCard from '../components/domain/GraphSummaryCard.jsx';
import TraceGraphTable from '../components/domain/TraceGraphTable.jsx';

export default function TraceabilityPage({ initialBatchId = '' }) {
  const [batchId, setBatchId] = useState(initialBatchId || '');
  const [nodeId, setNodeId] = useState('');
  const [query, setQuery] = useState('Tala');
  const [graph, setGraph] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [neighbors, setNeighbors] = useState(null);
  const [technicalResponses, setTechnicalResponses] = useState({});
  const [loading, setLoading] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialBatchId) setBatchId(initialBatchId);
  }, [initialBatchId]);

  const remember = (key, response) => {
    setTechnicalResponses((current) => ({ ...current, [key]: response }));
  };

  const run = async (label, action) => {
    setLoading(label);
    setError(null);
    try {
      const response = await action();
      remember(label, response);
      return response;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading('');
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
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
<<<<<<< HEAD
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
=======
        title="Trazabilidad"
        subtitle="Lectura del grafo de evidencia, relaciones y timeline por lote."
      />
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5

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

<<<<<<< HEAD
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
=======
        <div className="query-bar">
          <label className="field">
            <span>Busqueda</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <Button onClick={searchNodes} disabled={!query.trim() || loading === 'search'}>
            Buscar nodos
          </Button>
          <label className="field">
            <span>ID de nodo</span>
            <input
              value={nodeId}
              onChange={(event) => setNodeId(event.target.value)}
              placeholder="Ej. 12"
              inputMode="numeric"
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => loadNeighbors()}
            disabled={!nodeId || loading === 'neighbors'}
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
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

<<<<<<< HEAD
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
=======
      <div className="grid-2">
        <GraphSummaryCard graph={graph} timeline={timeline} />

        <Card title="Nodos y relaciones" className="col-span-2">
          {graph ? (
            <TraceGraphTable
              nodes={graph.nodes || []}
              edges={graph.edges || []}
              selectedId={selectedNodeId}
              onSelect={(node) => loadNeighbors(node.id)}
            />
          ) : (
            <EmptyState title="Sin grafo cargado" message="Consulta un lote proyectado." />
          )}
        </Card>

        <Card title="Timeline">
          <Timeline events={timeline} />
        </Card>

        <Card title="Resultado de busqueda">
          <TraceGraphTable
            nodes={searchResults}
            edges={[]}
            selectedId={selectedNodeId}
            onSelect={(node) => loadNeighbors(node.id)}
          />
        </Card>

        <Card title="Vecinos del nodo" className="col-span-2">
          {neighbors ? (
            <TraceGraphTable
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
              nodes={[neighbors.node, ...(neighbors.neighbors || [])].filter(Boolean)}
              selectedId={selectedNode?.id}
              onSelect={handleNodeSelect}
            />
<<<<<<< HEAD
          </Card>
        )}
=======
          ) : (
            <EmptyState title="Sin vecinos" message="Selecciona un nodo o consulta por ID." />
          )}
        </Card>

        <Card title="Detalle tecnico de trazabilidad" className="col-span-2">
          {Object.keys(technicalResponses).length ? (
            <div className="technical-list">
              {Object.entries(technicalResponses).map(([key, response]) => (
                <CollapsibleJson key={key} title={`Ver respuesta tecnica - ${key}`} data={response} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin respuestas tecnicas" message="Ejecuta una consulta para ver el detalle." />
          )}
        </Card>
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
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
