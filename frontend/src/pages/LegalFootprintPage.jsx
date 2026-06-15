import { useEffect } from 'react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import MetricCard from '../components/common/MetricCard.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import LegalFootprintSummary from '../components/domain/LegalFootprintSummary.jsx';
import TraceGraphTable from '../components/domain/TraceGraphTable.jsx';
import { useLegalFootprint } from '../hooks/useLegalFootprint.js';
import { toCount } from '../utils/formatters.js';

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
        title="Huella legal"
        subtitle="Ficha tecnica de trazabilidad, score, alertas y evidencia disponible."
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
            <span>ID de lote</span>
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
            {loading === 'summary' ? 'Consultando...' : 'Consultar resumen'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => loadFootprint()}
            disabled={!canQuery || loading === 'footprint'}
          >
            {loading === 'footprint' ? 'Consultando...' : 'Consultar huella'}
          </Button>
        </div>
      </Card>

      {loading && <LoadingState label="Esperando respuesta del backend..." />}

      <div className="grid-2">
        <LegalFootprintSummary summary={summary} footprint={footprint} />

        <Card title="Completitud documental">
          {footprint?.completeness ? (
            <div className="stack">
              <div className="grid-3">
                <MetricCard
                  title="Score"
                  value={footprint.completeness.score ?? '-'}
                  detail="Resultado tecnico de completitud"
                />
                <MetricCard
                  title="Reglas evaluadas"
                  value={toCount(footprint.completeness.rules_evaluated)}
                  detail="Si el backend lo reporta"
                />
                <MetricCard
                  title="Observaciones"
                  value={toCount(footprint.completeness.observations)}
                  detail="Señales para revision"
                />
              </div>
              <CollapsibleJson title="Detalle tecnico JSON" data={footprint.completeness} />
            </div>
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

        <Card title="Detalle tecnico de huella" className="col-span-2">
          {footprint || summary ? (
            <div className="technical-list">
              <CollapsibleJson title="Ver respuesta tecnica - resumen" data={summary} />
              <CollapsibleJson title="Ver respuesta tecnica - huella completa" data={footprint} />
            </div>
          ) : (
            <EmptyState
              title="Sin respuesta tecnica"
              message="Ejecuta una consulta para habilitar el detalle."
            />
          )}
        </Card>
      </div>
    </>
  );
}
