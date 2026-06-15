import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import JsonViewer from '../components/common/JsonViewer.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import VerificationCard, {
  PUBLIC_VERIFICATION_DISCLAIMER,
} from '../components/domain/VerificationCard.jsx';
import { useSnapshotVerification } from '../hooks/useSnapshotVerification.js';

export default function PublicVerificationPage({ initialBatchId = '' }) {
  const snapshotState = useSnapshotVerification(initialBatchId);
  const {
    batchId,
    setBatchId,
    verificationCode,
    setVerificationCode,
    snapshot,
    verification,
    backendSummary,
    loading,
    error,
    generateSnapshot,
    verifyCode,
    loadBackendSummary,
  } = snapshotState;

  const canGenerate = String(batchId || '').trim() !== '';
  const canVerify = String(verificationCode || '').trim() !== '';

  return (
    <>
      <SectionHeader
        title="Verificacion publica"
        subtitle="Snapshot, hash y verificacion por codigo Sprint 6."
        actions={
          <Button onClick={loadBackendSummary} disabled={Boolean(loading)}>
            {loading === 'backend-summary'
              ? 'Consultando...'
              : 'Ver backend-summary'}
          </Button>
        }
      />

      <p className="disclaimer">{PUBLIC_VERIFICATION_DISCLAIMER}</p>

      {error && (
        <EmptyState
          variant="error"
          title="Error en verificacion"
          message={error.message}
        />
      )}

      <div className="grid-2">
        <Card title="Generar snapshot">
          <div className="query-bar">
            <label className="field">
              <span>import_batch_id</span>
              <input
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
                placeholder="Ej. 1"
                inputMode="numeric"
              />
            </label>
            <Button
              onClick={() => generateSnapshot()}
              disabled={!canGenerate || Boolean(loading)}
            >
              {loading === 'snapshot' ? 'Generando...' : 'Generar snapshot'}
            </Button>
          </div>
        </Card>

        <Card title="Verificar codigo">
          <div className="query-bar">
            <label className="field field--wide">
              <span>verification_code</span>
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="HLF-1-XXXXXXXX"
              />
            </label>
            <Button
              variant="secondary"
              onClick={() => verifyCode()}
              disabled={!canVerify || Boolean(loading)}
            >
              {loading === 'verify' ? 'Verificando...' : 'Verificar'}
            </Button>
          </div>
        </Card>
      </div>

      {loading && <LoadingState label="Esperando respuesta del backend..." />}

      <div className="grid-2">
        <VerificationCard title="Snapshot generado" payload={snapshot} />
        <VerificationCard title="Payload publico verificado" payload={verification} />

        <Card title="Respuesta backend-summary" className="col-span-2">
          {backendSummary ? (
            <JsonViewer value={backendSummary} />
          ) : (
            <EmptyState
              title="Sin backend-summary"
              message="Consulta GET /demo/backend-summary para confirmar disponibilidad."
            />
          )}
        </Card>
      </div>
    </>
  );
}
