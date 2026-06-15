import { formatDateTime } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import EmptyState from '../common/EmptyState.jsx';
import JsonViewer from '../common/JsonViewer.jsx';

function severityVariant(severity) {
  const value = String(severity || '').toUpperCase();
  if (value === 'CRITICAL' || value === 'ERROR') return 'danger';
  if (value === 'WARNING') return 'warning';
  if (value === 'INFO') return 'info';
  return 'neutral';
}

export default function AlertList({
  alerts = [],
  selectedId,
  onSelect,
  onChangeStatus,
  changingStatus = false,
  statuses = [],
}) {
  if (!alerts.length) {
    return (
      <EmptyState
        title="Sin alertas"
        message="No hay alertas para el lote y filtros actuales."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Tipo</th>
            <th>Severidad</th>
            <th>Titulo</th>
            <th>Descripcion</th>
            <th>Estado</th>
            <th>Evidencia</th>
            <th>Actualizado</th>
            <th aria-label="acciones" />
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              className={selectedId === alert.id ? 'is-selected' : ''}
            >
              <td className="mono">{alert.alert_code}</td>
              <td>{alert.alert_type}</td>
              <td>
                <Badge variant={severityVariant(alert.severity)}>
                  {alert.severity}
                </Badge>
              </td>
              <td>{alert.title}</td>
              <td>{alert.description || '-'}</td>
              <td>
                <Badge status={alert.status} />
              </td>
              <td className="table-cell-json">
                <JsonViewer
                  value={alert.evidence}
                  className="json-viewer--compact"
                />
              </td>
              <td>{formatDateTime(alert.updated_at)}</td>
              <td>
                <div className="row row--nowrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelect?.(alert.id)}
                  >
                    Detalle
                  </Button>
                  {onChangeStatus && (
                    <select
                      className="select select--sm"
                      value={alert.status || ''}
                      disabled={changingStatus}
                      onChange={(event) =>
                        onChangeStatus(alert.id, event.target.value)
                      }
                      aria-label={`Cambiar estado de ${alert.alert_code}`}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
