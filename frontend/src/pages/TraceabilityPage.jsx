import { useEffect, useState } from 'react';
import { graphApi } from '../api/graphApi.js';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import JsonViewer from '../components/common/JsonViewer.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import TraceGraphTable from '../components/domain/TraceGraphTable.jsx';
import { formatDateTime } from '../utils/formatters.js';

function Timeline({ events = [] }) {
  if (!events.length) {
    return <EmptyState title="Sin eventos" message="No hay timeline para este lote." />;
  }

  return (
    <ul className="timeline">
      {events.map((event) => (
        <li className="timeline__item" key={event.id}>
          <span className="timeline__dot" />
          <div className="timeline__event">{event.event_type}</div>
          <div className="timeline__time">{formatDateTime(event.created_at)}</div>
          <JsonViewer value={event.payload} className="json-viewer--compact" />
        </li>
      ))}
    </ul>
  );
}

export default function TraceabilityPage({ initialBatchId = '' }) {
  const [batchId, setBatchId] = useState(initialBatchId || '');
  const [nodeId, setNodeId] = useState('');
  const [query, setQuery] = useState('Tala');
  const [graph, setGraph] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [neighbors, setNeighbors] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialBatchId) setBatchId(initialBatchId);
  }, [initialBatchId]);

  const run = async (label, action) => {
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
        title="Grafo de trazabilidad"
        subtitle="Consulta directa de endpoints Sprint 3 por lote, nodo y texto."
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
            <span>Búsqueda</span>
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
        <Card title="Grafo por lote" className="col-span-2">
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

        <Card title="Timeline simple">
          <Timeline events={timeline} />
        </Card>

        <Card title="Resultado de búsqueda">
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
      </div>
    </>
  );
}
