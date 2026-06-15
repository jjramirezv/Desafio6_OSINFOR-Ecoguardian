import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import SummaryCard from '../components/common/SummaryCard.jsx';
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
        subtitle="Ficha final para codigo, hash, estado, score y resumen verificable."
        actions={
          <Button onClick={loadBackendSummary} disabled={Boolean(loading)}>
            {loading === 'backend-summary'
              ? 'Consultando...'
              : 'Consultar resumen backend'}
          </Button>
        }
      />

      <div className="verification-banner">
        <strong>Esta verificacion no certifica legalidad.</strong>
        <span>
          Resume trazabilidad tecnica, consistencia documental y alertas
          registradas.
        </span>
      </div>

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
              <span>ID de lote</span>
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
              <span>Codigo de verificacion</span>
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

      {loading && <ProgressBar label="Esperando respuesta del backend..." />}

      <div className="grid-2">
        <VerificationCard title="Snapshot generado" payload={snapshot} />
        <VerificationCard title="Codigo verificado" payload={verification} />

        <SummaryCard
          title="Resumen backend"
          subtitle="Estado y metadatos reportados por la API"
          accent
          className="col-span-2"
          items={backendSummary ? [
            { label: 'Estado', value: backendSummary.status || 'Disponible', badge: true },
            { label: 'Servicio', value: backendSummary.service || backendSummary.project || 'API' },
          ] : []}
          footer={
            backendSummary ? (
              <CollapsibleJson title="Ver respuesta tecnica" data={backendSummary} />
            ) : (
              <EmptyState
                title="Sin resumen backend"
                message="Consulta el resumen para confirmar disponibilidad de la API."
              />
            )
          }
        />
      </div>
    </>
  );
}
