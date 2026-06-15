import { useEffect, useState } from 'react';
import { graphApi } from '../api/graphApi.js';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
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
    }
  };

  const loadGraph = () =>
    run('graph', async () => {
      const response = await graphApi.graphByBatch(batchId);
      setGraph(response.data);
      return response;
    });

  const loadTimeline = () =>
    run('timeline', async () => {
      const response = await graphApi.timelineByBatch(batchId);
      setTimeline(Array.isArray(response.data) ? response.data : []);
      return response;
    });

  const searchNodes = () =>
    run('search', async () => {
      const response = await graphApi.search(query);
      setSearchResults(Array.isArray(response.data) ? response.data : []);
      return response;
    });

  const loadNeighbors = (id = nodeId) =>
    run('neighbors', async () => {
      const response = await graphApi.neighbors(id);
      setNeighbors(response.data);
      setNodeId(String(id));
      return response;
    });

  const selectedNodeId = neighbors?.node?.id ? Number(neighbors.node.id) : null;

  return (
    <>
      <SectionHeader
        title="Trazabilidad"
        subtitle="Lectura del grafo de evidencia, relaciones y timeline por lote."
      />

      {error && (
        <EmptyState
          variant="error"
          title="Error consultando trazabilidad"
          message={error.message}
        />
      )}

      <Card title="Consultas">
        <div className="query-bar">
          <label className="field">
            <span>ID de lote</span>
            <input
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              placeholder="Ej. 1"
              inputMode="numeric"
            />
          </label>
          <Button onClick={loadGraph} disabled={!batchId || loading === 'graph'}>
            {loading === 'graph' ? 'Consultando...' : 'Consultar grafo'}
          </Button>
          <Button
            variant="secondary"
            onClick={loadTimeline}
            disabled={!batchId || loading === 'timeline'}
          >
            {loading === 'timeline' ? 'Consultando...' : 'Ver timeline'}
          </Button>
        </div>

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
          >
            Consultar vecinos
          </Button>
        </div>
      </Card>

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
              nodes={[neighbors.node, ...(neighbors.neighbors || [])].filter(Boolean)}
              edges={neighbors.edges || []}
              selectedId={selectedNodeId}
              onSelect={(node) => loadNeighbors(node.id)}
            />
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
      </div>
    </>
  );
}
