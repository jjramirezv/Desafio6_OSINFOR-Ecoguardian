import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import JsonViewer from '../components/common/JsonViewer.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import { DISCLAIMER } from '../api/httpClient.js';

const SPRINT_1_3_MODULES = [
  'SaaS base',
  'Conector interoperable',
  'Grafo de trazabilidad',
];

export default function DashboardPage({ backend }) {
  const {
    summary,
    health,
    loadingSummary,
    checkingHealth,
    error,
    healthError,
    loadSummary,
    checkHealth,
  } = backend;

  return (
    <>
      <SectionHeader
        title="Huella Legal Forestal"
        subtitle="Verificación técnica de trazabilidad y consistencia documental."
        actions={
          <div className="row">
            <Button variant="secondary" onClick={loadSummary} disabled={loadingSummary}>
              Recargar resumen
            </Button>
            <Button onClick={checkHealth} disabled={checkingHealth}>
              {checkingHealth ? 'Verificando...' : 'Verificar /health'}
            </Button>
          </div>
        }
      />

      <p className="disclaimer">{DISCLAIMER}</p>

      <div className="grid-2">
        <Card
          title="Estado backend"
          actions={summary?.backend_status ? <Badge status={summary.backend_status} /> : null}
          accent
        >
          {loadingSummary && <LoadingState label="Cargando backend-summary..." />}
          {error && (
            <EmptyState
              variant="error"
              title="No se pudo cargar /demo/backend-summary"
              message={error.message}
            />
          )}
          {summary && (
            <div className="kv">
              <div className="kv__item">
                <span className="kv__key">Proyecto</span>
                <span className="kv__value">{summary.project}</span>
              </div>
              <div className="kv__item">
                <span className="kv__key">Estado</span>
                <span className="kv__value">
                  <Badge status={summary.backend_status} />
                </span>
              </div>
              <div className="kv__item">
                <span className="kv__key">Backend reporta sprints</span>
                <span className="kv__value">{summary.implemented_sprints}</span>
              </div>
              <div className="kv__item">
                <span className="kv__key">Alcance frontend</span>
                <span className="kv__value">Sprint 1-3</span>
              </div>
            </div>
          )}
        </Card>

        <Card title="Módulos implementados en esta base frontend">
          <div className="module-list">
            {SPRINT_1_3_MODULES.map((module) => (
              <div className="module-item" key={module}>
                <span className="module-item__mark">OK</span>
                <span>{module}</span>
              </div>
            ))}
          </div>
          <p className="text-sm muted">
            El backend puede exponer módulos posteriores; esta interfaz se limita
            a estado, conector interoperable y grafo de trazabilidad.
          </p>
        </Card>

        <Card title="Resultado /health">
          {healthError && (
            <EmptyState
              variant="error"
              title="Health check falló"
              message={healthError.message}
            />
          )}
          {!health && !healthError && (
            <EmptyState title="Sin consulta" message="Ejecuta Verificar /health." />
          )}
          {health && <JsonViewer value={health} />}
        </Card>

        <Card title="Respuesta backend-summary">
          {summary ? <JsonViewer value={summary} /> : <EmptyState title="Sin datos" />}
        </Card>
      </div>
    </>
  );
}
