// Tarjeta de dominio que resume el lote de importacion activo: id, batch_code,
// estado y contadores. Reutiliza Card y Badge comunes.

import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import { toCount } from '../../utils/formatters.js';

export default function ImportBatchCard({ batch }) {
  if (!batch) {
    return (
      <Card title="Lote activo" accent>
        <p className="muted text-sm">
          Aún no se ha creado un lote. Ejecuta el paso «Crear lote demo».
        </p>
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
    <Card
      title="Lote activo"
      accent
      actions={<Badge status={batch.status} />}
    >
      <div className="kv">
        <div className="kv__item">
          <span className="kv__key">ID</span>
          <span className="kv__value mono">#{batch.id}</span>
        </div>
        <div className="kv__item">
          <span className="kv__key">batch_code</span>
          <span className="kv__value mono">{batch.batch_code}</span>
        </div>
        <div className="kv__item kv__item--full">
          <span className="kv__key">Nombre</span>
          <span className="kv__value">{batch.name || '—'}</span>
        </div>
        <div className="kv__item">
          <span className="kv__key">import_type</span>
          <span className="kv__value">{batch.import_type}</span>
        </div>
        <div className="kv__item">
          <span className="kv__key">Estado</span>
          <span className="kv__value">
            <Badge status={batch.status} />
          </span>
        </div>
        <div className="kv__item kv__item--full">
          <span className="kv__key">Contadores</span>
          <div className="chips">
            <span className="chip">total: <b>{toCount(counters.total_rows)}</b></span>
            <span className="chip">
              procesados: <b>{toCount(counters.processed_rows)}</b>
            </span>
            <span className="chip">
              ok: <b>{toCount(counters.successful_rows)}</b>
            </span>
            <span className="chip">
              fallidos: <b>{toCount(counters.failed_rows)}</b>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
