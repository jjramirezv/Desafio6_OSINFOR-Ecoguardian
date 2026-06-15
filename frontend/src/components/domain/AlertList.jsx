import { formatDateTime, prettyJson } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import CollapsibleJson from '../common/CollapsibleJson.jsx';
import EmptyState from '../common/EmptyState.jsx';

function severityVariant(severity) {
  const value = String(severity || '').toUpperCase();
  if (value === 'CRITICAL' || value === 'ERROR') return 'danger';
  if (value === 'WARNING') return 'warning';
  if (value === 'INFO') return 'info';
  return 'neutral';
}

function evidenceSummary(evidence) {
  if (!evidence) return 'Sin evidencia adjunta.';
  if (typeof evidence === 'string') return evidence;

  const entries = Object.entries(evidence);
  if (!entries.length) return 'Sin evidencia adjunta.';

  return entries
    .slice(0, 3)
    .map(([key, value]) => {
      const rendered =
        value && typeof value === 'object' ? prettyJson(value).replace(/\s+/g, ' ') : value;
      return `${key}: ${String(rendered).slice(0, 90)}`;
    })
    .join(' | ');
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
    <div className="alert-list">
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className={`alert-card ${selectedId === alert.id ? 'is-selected' : ''}`}
        >
          <div className="alert-card__main">
            <div className="alert-card__header">
              <span className="mono alert-card__code">{alert.alert_code}</span>
              <Badge variant={severityVariant(alert.severity)}>
                {alert.severity || 'SIN SEVERIDAD'}
              </Badge>
              <Badge status={alert.status} />
            </div>
            <h3>{alert.title || 'Alerta sin titulo'}</h3>
            <p>{alert.description || 'Sin descripcion registrada.'}</p>
            <div className="alert-card__meta">
              <span>Tipo: {alert.alert_type || '-'}</span>
              <span>Actualizado: {formatDateTime(alert.updated_at)}</span>
            </div>
            <div className="alert-card__evidence">
              <strong>Evidencia resumida</strong>
              <span>{evidenceSummary(alert.evidence)}</span>
            </div>
            <CollapsibleJson title="Detalle tecnico JSON" data={alert} />
          </div>
          <div className="alert-card__actions">
            <Button size="sm" variant="ghost" onClick={() => onSelect?.(alert.id)}>
              Detalle
            </Button>
            {onChangeStatus && (
              <select
                className="select select--sm"
                value={alert.status || ''}
                disabled={changingStatus}
                onChange={(event) => onChangeStatus(alert.id, event.target.value)}
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
        </article>
      ))}
    </div>
  );
}
