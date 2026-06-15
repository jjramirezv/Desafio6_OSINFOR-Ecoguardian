import { formatDateTime } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import CollapsibleJson from '../common/CollapsibleJson.jsx';
import EmptyState from '../common/EmptyState.jsx';

export const PUBLIC_VERIFICATION_DISCLAIMER =
  'Esta verificacion no certifica legalidad; resume trazabilidad tecnica, consistencia documental y alertas registradas.';

function pickSummary(payload) {
  return (
    payload?.summary ||
    payload?.message ||
    payload?.footprint?.message ||
    payload?.payload?.message ||
    'Snapshot verificable generado desde evidencia tecnica disponible.'
  );
}

export default function VerificationCard({ title, payload }) {
  if (!payload) {
    return (
      <Card title={title}>
        <EmptyState
          title="Sin datos"
          message="Genera un snapshot o verifica un codigo para ver la ficha."
        />
      </Card>
    );
  }

  return (
    <Card title={title} actions={<Badge status={payload.status} />} accent>
      <div className="stack">
        <div className="verification-callout">
          <strong>{payload.verification_code || 'Codigo de verificacion'}</strong>
          <span>{pickSummary(payload)}</span>
        </div>
        <div className="kv">
          <div className="kv__item kv__item--full">
            <span className="kv__key">Codigo de verificacion</span>
            <span className="kv__value mono">{payload.verification_code || '-'}</span>
          </div>
          <div className="kv__item kv__item--full">
            <span className="kv__key">Hash</span>
            <span className="kv__value mono">{payload.footprint_hash || '-'}</span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Estado</span>
            <span className="kv__value">
              <Badge status={payload.status} />
            </span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Score</span>
            <span className="kv__value">{payload.score ?? '-'}</span>
          </div>
          <div className="kv__item kv__item--full">
            <span className="kv__key">Fecha de generacion</span>
            <span className="kv__value">
              {formatDateTime(payload.generated_at || payload.created_at)}
            </span>
          </div>
        </div>
        <p className="disclaimer">
          {payload.disclaimer || PUBLIC_VERIFICATION_DISCLAIMER}
        </p>
        <CollapsibleJson title="Ver respuesta tecnica" data={payload} />
      </div>
    </Card>
  );
}
