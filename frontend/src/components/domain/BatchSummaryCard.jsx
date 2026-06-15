import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { toCount } from '../../utils/formatters.js';

export default function BatchSummaryCard({ batch, title = 'Resumen del lote' }) {
  if (!batch) {
    return (
      <Card title={title} accent>
        <EmptyState
          title="Sin lote activo"
          message="Crea un lote para iniciar el flujo interoperable."
        />
      </Card>
    );
  }

  const counters = batch.counters || {
    total_rows: batch.total_rows,
    processed_rows: batch.processed_rows,
    successful_rows: batch.successful_rows,
    failed_rows: batch.failed_rows,
  };

  return (
    <Card title={title} actions={<Badge status={batch.status} />} accent>
      <div className="kv">
        <div className="kv__item">
          <span className="kv__key">ID del lote</span>
          <span className="kv__value mono">#{batch.id}</span>
        </div>
        <div className="kv__item">
          <span className="kv__key">Codigo</span>
          <span className="kv__value mono">{batch.batch_code || '-'}</span>
        </div>
        <div className="kv__item">
          <span className="kv__key">Tipo de importacion</span>
          <span className="kv__value">{batch.import_type || '-'}</span>
        </div>
        <div className="kv__item">
          <span className="kv__key">Estado</span>
          <span className="kv__value">
            <Badge status={batch.status} />
          </span>
        </div>
        <div className="kv__item">
          <span className="kv__key">Registros exitosos</span>
          <span className="kv__value">{toCount(counters.successful_rows)}</span>
        </div>
        <div className="kv__item">
          <span className="kv__key">Registros fallidos</span>
          <span className="kv__value">{toCount(counters.failed_rows)}</span>
        </div>
      </div>
    </Card>
  );
}
