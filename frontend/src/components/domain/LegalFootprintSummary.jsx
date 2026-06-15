import { toCount } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import CollapsibleJson from '../common/CollapsibleJson.jsx';
import EmptyState from '../common/EmptyState.jsx';

export const FOOTPRINT_DISCLAIMER =
  'La huella resume evidencia tecnica disponible. No certifica legalidad.';

function statusCopy(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'TRACEABLE') return 'La trazabilidad tecnica esta completa para el lote consultado.';
  if (value === 'OBSERVED') return 'El lote tiene observaciones que requieren revision.';
  if (value === 'INCOMPLETE') return 'La evidencia disponible no completa la trazabilidad esperada.';
  return 'Consulta generada con los datos disponibles en el backend.';
}

function countValue(summary, footprint, key, fallback) {
  return summary?.counts?.[key] ?? fallback ?? 0;
}

export default function LegalFootprintSummary({ summary, footprint }) {
  if (!summary && !footprint) {
    return (
      <Card title="Ficha de huella" accent>
        <EmptyState
          title="Sin huella cargada"
          message="Consulta un ID de lote para ver estado, score y evidencia."
        />
      </Card>
    );
  }

  const status = summary?.status || footprint?.status;
  const score = summary?.score ?? footprint?.completeness?.score ?? null;
  const sourceRecords = countValue(
    summary,
    footprint,
    'source_records',
    footprint?.source_records?.length
  );
  const errors = countValue(summary, footprint, 'errors', footprint?.errors?.length);
  const graphNodes = countValue(
    summary,
    footprint,
    'graph_nodes',
    footprint?.graph?.nodes?.length
  );
  const graphEdges = countValue(
    summary,
    footprint,
    'graph_edges',
    footprint?.graph?.edges?.length
  );
  const alerts = summary?.alerts || footprint?.alerts || {};

  return (
    <Card title="Ficha de huella" actions={<Badge status={status} size="lg" />} accent>
      <div className="stack">
        <div className="footprint-status">
          <Badge status={status} size="lg" />
          <strong>{statusCopy(status)}</strong>
        </div>
        <div className="kv">
          <div className="kv__item">
            <span className="kv__key">Estado de huella</span>
            <span className="kv__value">
              <Badge status={status} />
            </span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Score</span>
            <span className="kv__value">{score ?? '-'}</span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Codigo de lote</span>
            <span className="kv__value mono">{summary?.batch_code || footprint?.batch_code || '-'}</span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Tipo de importacion</span>
            <span className="kv__value">{summary?.import_type || footprint?.import_type || '-'}</span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Cantidad de registros</span>
            <span className="kv__value">{toCount(sourceRecords)}</span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Errores</span>
            <span className="kv__value">{toCount(errors)}</span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Nodos del grafo</span>
            <span className="kv__value">{toCount(graphNodes)}</span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Relaciones del grafo</span>
            <span className="kv__value">{toCount(graphEdges)}</span>
          </div>
          <div className="kv__item kv__item--full">
            <span className="kv__key">Alertas</span>
            <div className="chips">
              {Object.keys(alerts).length ? (
                Object.entries(alerts).map(([key, value]) => (
                  <span className="chip" key={key}>
                    {key}: <b>{toCount(value)}</b>
                  </span>
                ))
              ) : (
                <span className="muted text-sm">Sin alertas integradas.</span>
              )}
            </div>
          </div>
          <div className="kv__item kv__item--full">
            <span className="kv__key">Mensaje interpretativo</span>
            <span className="kv__value">
              {summary?.message || footprint?.message || statusCopy(status)}
            </span>
          </div>
        </div>
        <p className="disclaimer">{FOOTPRINT_DISCLAIMER}</p>
        <CollapsibleJson title="Detalle tecnico JSON" data={{ summary, footprint }} />
      </div>
    </Card>
  );
}
