import { useEffect } from 'react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import SummaryCard from '../components/common/SummaryCard.jsx';
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

      {loading && <ProgressBar label="Esperando respuesta del backend..." />}

      <div className="grid-2">
        <LegalFootprintSummary summary={summary} footprint={footprint} />

        <SummaryCard
          title="Completitud documental"
          subtitle="Score, reglas evaluadas y observaciones tecnicas"
          metrics={footprint?.completeness ? [
            { label: 'Score', value: footprint.completeness.score ?? '-', color: 'var(--brand-primary)' },
            { label: 'Reglas evaluadas', value: toCount(footprint.completeness.rules_evaluated) },
            { label: 'Observaciones', value: toCount(footprint.completeness.observations), color: 'var(--c-osinfor-ambar)' },
          ] : []}
          footer={
            footprint?.completeness ? (
              <CollapsibleJson title="Detalle tecnico JSON" data={footprint.completeness} />
            ) : (
              <EmptyState
                title="Sin completitud"
                message="Consulta la huella completa para ver este bloque."
              />
            )
          }
        />

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

        <SummaryCard
          title="Detalle tecnico de huella"
          subtitle="Respuestas JSON del backend para resumen y huella completa"
          accent
          className="col-span-2"
          footer={
            footprint || summary ? (
              <div className="technical-list">
                <CollapsibleJson title="Ver respuesta tecnica - resumen" data={summary} />
                <CollapsibleJson title="Ver respuesta tecnica - huella completa" data={footprint} />
              </div>
            ) : (
              <EmptyState
                title="Sin respuesta tecnica"
                message="Ejecuta una consulta para habilitar el detalle."
              />
            )
          }
        />
      </div>
    </>
  );
}
