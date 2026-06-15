import Badge from '../common/Badge.jsx';
import EmptyState from '../common/EmptyState.jsx';
import Table from '../common/Table.jsx';

const SEVERITY_MAP = {
  ERROR: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  CRITICAL: 'danger',
};

const ERROR_COLUMNS = [
  { key: 'row_number', label: 'Fila', width: '70px' },
  { key: 'field_name', label: 'Campo' },
  { key: 'error_code', label: 'Código' },
  {
    key: 'severity',
    label: 'Severidad',
    width: '110px',
    render: (row) => (
      <Badge variant={SEVERITY_MAP[row.severity] || 'neutral'} size="sm">
        {row.severity || 'ERROR'}
      </Badge>
    ),
  },
  { key: 'error_message', label: 'Mensaje' },
];

export default function ImportErrorsTable({ errors }) {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) {
    return (
      <EmptyState
        title="Sin errores"
        message="No se detectaron errores de normalización en este lote."
      />
    );
  }

  const rows = Array.isArray(errors) ? errors : [errors];

  return (
    <div>
      <div className="row" style={{ marginBottom: 'var(--sp-3)' }}>
        <Badge variant="danger">{rows.length} error(es)</Badge>
      </div>
      <Table
        columns={ERROR_COLUMNS}
        rows={rows}
        keyExtractor={(r, i) => `${r.row_number}-${r.field_name}-${i}`}
      />
    </div>
  );
}
