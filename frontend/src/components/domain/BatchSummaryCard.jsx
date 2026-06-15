import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import KvGroup from '../common/KvGroup.jsx';
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
      <KvGroup
        items={[
          { label: 'ID del lote', value: `#${batch.id}`, mono: true },
          { label: 'Codigo', value: batch.batch_code || '-', mono: true },
          { label: 'Tipo de importacion', value: batch.import_type || '-' },
          { label: 'Estado', value: batch.status, badge: true },
          { label: 'Registros exitosos', value: toCount(counters.successful_rows) },
          { label: 'Registros fallidos', value: toCount(counters.failed_rows) },
        ]}
      />
    </Card>
  );
}
