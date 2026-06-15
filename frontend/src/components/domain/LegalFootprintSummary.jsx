import { humanizeKey, toCount } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';

const FOOTPRINT_DISCLAIMER =
  'Resultado tecnico orientativo basado en trazabilidad, consistencia documental y evidencia disponible.';

function CountChips({ counts = {} }) {
  const entries = Object.entries(counts);

  if (!entries.length) {
    return <span className="muted text-sm">Sin counts reportados.</span>;
  }

  return (
    <div className="chips">
      {entries.map(([key, value]) => (
        <span className="chip" key={key}>
          {humanizeKey(key)}: <b>{toCount(value)}</b>
        </span>
      ))}
    </div>
  );
}

function AlertsBlock({ alerts = {} }) {
  const entries = Object.entries(alerts);

  if (!entries.length) {
    return <span className="muted text-sm">Sin alertas integradas.</span>;
  }

  return (
    <div className="chips">
      {entries.map(([key, value]) => (
        <span className="chip" key={key}>
          {humanizeKey(key)}: <b>{toCount(value)}</b>
        </span>
      ))}
    </div>
  );
}

export default function LegalFootprintSummary({ summary, footprint }) {
  if (!summary && !footprint) {
    return (
      <Card title="Resumen de huella" accent>
        <EmptyState
          title="Sin huella cargada"
          message="Consulta un import_batch_id para ver estado, score y counts."
        />
      </Card>
    );
  }

  const status = summary?.status || footprint?.status;
  const score = summary?.score ?? footprint?.completeness?.score ?? null;
  const counts =
    summary?.counts ||
    (footprint
      ? {
          source_records: footprint.source_records?.length,
          errors: footprint.errors?.length,
          graph_nodes: footprint.graph?.nodes?.length,
          graph_edges: footprint.graph?.edges?.length,
          events: footprint.events?.length,
        }
      : {});

  return (
    <Card title="Resumen de huella" actions={<Badge status={status} />} accent>
      <div className="stack">
        <div className="kv">
          <div className="kv__item">
            <span className="kv__key">Estado tecnico</span>
            <span className="kv__value">
              <Badge status={status} size="lg" />
            </span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Score</span>
            <span className="kv__value">{score ?? '-'}</span>
          </div>
          {summary?.batch_code && (
            <div className="kv__item">
              <span className="kv__key">batch_code</span>
              <span className="kv__value mono">{summary.batch_code}</span>
            </div>
          )}
          {summary?.import_type && (
            <div className="kv__item">
              <span className="kv__key">import_type</span>
              <span className="kv__value">{summary.import_type}</span>
            </div>
          )}
          <div className="kv__item kv__item--full">
            <span className="kv__key">Counts</span>
            <CountChips counts={counts} />
          </div>
          <div className="kv__item kv__item--full">
            <span className="kv__key">Alertas integradas</span>
            <AlertsBlock alerts={summary?.alerts || footprint?.alerts} />
          </div>
          {summary?.message && (
            <div className="kv__item kv__item--full">
              <span className="kv__key">Mensaje</span>
              <span className="kv__value">{summary.message}</span>
            </div>
          )}
        </div>
        <p className="disclaimer">{FOOTPRINT_DISCLAIMER}</p>
      </div>
    </Card>
  );
}
