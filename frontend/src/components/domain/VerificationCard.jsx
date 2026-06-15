import { formatDateTime } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import JsonViewer from '../common/JsonViewer.jsx';

export const PUBLIC_VERIFICATION_DISCLAIMER =
  'Esta verificación no certifica legalidad; resume trazabilidad técnica, consistencia documental y alertas registradas.';

export default function VerificationCard({ title, payload }) {
  if (!payload) {
    return (
      <Card title={title}>
        <EmptyState
          title="Sin datos"
          message="Genera un snapshot o verifica un codigo para ver el payload."
        />
      </Card>
    );
  }

  return (
    <Card title={title} actions={<Badge status={payload.status} />}>
      <div className="stack">
        <div className="kv">
          {payload.verification_code && (
            <div className="kv__item kv__item--full">
              <span className="kv__key">verification_code</span>
              <span className="kv__value mono">{payload.verification_code}</span>
            </div>
          )}
          {payload.footprint_hash && (
            <div className="kv__item kv__item--full">
              <span className="kv__key">footprint_hash</span>
              <span className="kv__value mono">{payload.footprint_hash}</span>
            </div>
          )}
          <div className="kv__item">
            <span className="kv__key">Estado tecnico</span>
            <span className="kv__value">
              <Badge status={payload.status} />
            </span>
          </div>
          <div className="kv__item">
            <span className="kv__key">Score</span>
            <span className="kv__value">{payload.score ?? '-'}</span>
          </div>
          {payload.generated_at && (
            <div className="kv__item kv__item--full">
              <span className="kv__key">generated_at</span>
              <span className="kv__value">{formatDateTime(payload.generated_at)}</span>
            </div>
          )}
        </div>
        <p className="disclaimer">
          {payload.disclaimer || PUBLIC_VERIFICATION_DISCLAIMER}
        </p>
        <JsonViewer value={payload} />
      </div>
    </Card>
  );
}
