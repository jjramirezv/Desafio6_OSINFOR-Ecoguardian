import { useEffect } from 'react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import JsonViewer from '../components/common/JsonViewer.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import LegalFootprintSummary from '../components/domain/LegalFootprintSummary.jsx';
import TraceGraphTable from '../components/domain/TraceGraphTable.jsx';
import { useLegalFootprint } from '../hooks/useLegalFootprint.js';

export default function LegalFootprintPage({
  initialBatchId = '',
  onBatchChange,
}) {
  const footprintState = useLegalFootprint(initialBatchId);
  const {
    batchId,
    setBatchId,
    footprint,
    summary,
    loading,
    error,
    loadFootprint,
    loadSummary,
    loadAll,
  } = footprintState;

  useEffect(() => {
    if (batchId) onBatchChange?.(batchId);
  }, [batchId, onBatchChange]);

  const canQuery = String(batchId || '').trim() !== '';

  return (
    <>
      <SectionHeader
        title="Huella tecnica por lote"
        subtitle="Consulta completa y resumen Sprint 4 desde endpoints reales."
        actions={
          <Button onClick={loadAll} disabled={!canQuery || Boolean(loading)}>
            {loading ? 'Consultando...' : 'Consultar todo'}
          </Button>
        }
      />

      {error && (
        <EmptyState
          variant="error"
          title="Error consultando huella"
          message={error.message}
        />
      )}

      <Card title="Consulta">
        <div className="query-bar">
          <label className="field">
            <span>import_batch_id</span>
            <input
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              placeholder="Ej. 1"
              inputMode="numeric"
            />
          </label>
          <Button
            onClick={() => loadSummary()}
            disabled={!canQuery || loading === 'summary'}
          >
            {loading === 'summary' ? 'Consultando...' : 'Consultar summary'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => loadFootprint()}
            disabled={!canQuery || loading === 'footprint'}
          >
            {loading === 'footprint' ? 'Consultando...' : 'Consultar completa'}
          </Button>
        </div>
      </Card>

      {loading && <LoadingState label="Esperando respuesta del backend..." />}

      <div className="grid-2">
        <LegalFootprintSummary summary={summary} footprint={footprint} />

        <Card title="Completitud">
          {footprint?.completeness ? (
            <JsonViewer value={footprint.completeness} />
          ) : (
            <EmptyState
              title="Sin completitud"
              message="Consulta la huella completa para ver este bloque."
            />
          )}
        </Card>

        <Card title="Grafo de la huella" className="col-span-2">
          {footprint?.graph ? (
            <TraceGraphTable
              nodes={footprint.graph.nodes || []}
              edges={footprint.graph.edges || []}
            />
          ) : (
            <EmptyState
              title="Sin grafo cargado"
              message="Consulta la huella completa del lote."
            />
          )}
        </Card>

        <Card title="Huella completa" className="col-span-2">
          {footprint ? (
            <JsonViewer value={footprint} />
          ) : (
            <EmptyState
              title="Sin respuesta completa"
              message="Ejecuta Consultar completa."
            />
          )}
        </Card>
      </div>
    </>
  );
}
