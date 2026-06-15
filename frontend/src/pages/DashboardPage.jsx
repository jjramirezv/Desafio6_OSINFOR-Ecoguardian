import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import KvGroup from '../components/common/KvGroup.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import MetricCard from '../components/common/MetricCard.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import SummaryCard from '../components/common/SummaryCard.jsx';
import { DISCLAIMER } from '../api/httpClient.js';

const MODULES = [
  'Conector interoperable',
  'Trazabilidad',
  'Huella legal',
  'Alertas',
  'Verificacion publica',
  'Resumen operativo',
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

  const implementedModules = Array.isArray(summary?.modules)
    ? summary.modules.length
    : MODULES.length;

  return (
    <>
      <SectionHeader
        title="Huella Legal Forestal"
        subtitle="Plataforma institucional para trazabilidad forestal, consistencia documental y verificacion tecnica."
        actions={
          <div className="row">
            <Button variant="secondary" onClick={loadSummary} disabled={loadingSummary}>
              Recargar
            </Button>
            <Button onClick={checkHealth} disabled={checkingHealth}>
              {checkingHealth ? 'Verificando...' : 'Verificar salud'}
            </Button>
          </div>
        }
      />

      <div className="callout">
        <strong>Aviso</strong>
        <span>{DISCLAIMER}</span>
      </div>

      {(loadingSummary || checkingHealth) && (
        <ProgressBar value={0} max={1} label="Consultando estado del backend..." />
      )}

      {(error || healthError) && (
        <EmptyState
          variant="error"
          title="No se pudo confirmar el estado completo"
          message={(error || healthError)?.message}
        />
      )}

      <div className="grid-4">
        <MetricCard
          title="Backend operativo"
          value={summary?.backend_status || health?.status || 'Pendiente'}
          detail="Disponibilidad reportada por la API"
          status={summary?.backend_status || health?.status}
          accent
        />
        <MetricCard
          title="Modulos implementados"
          value={implementedModules}
          detail="Capacidades visibles para la demo"
          variant="success"
        />
        <MetricCard
          title="Total de sprints backend"
          value={summary?.implemented_sprints || '-'}
          detail="Cobertura tecnica informada por backend"
          variant="info"
        />
        <MetricCard
          title="No certifica legalidad"
          value="Aviso"
          detail="La plataforma resume evidencia tecnica disponible"
          variant="warning"
        />
      </div>

      <div className="grid-2">
        <Card title="Proposito del sistema" accent>
          <p className="text-readable">
            Consolidar evidencia forestal en un flujo verificable: ingesta,
            normalizacion, proyeccion de trazabilidad, evaluacion de consistencia
            y generacion de snapshots publicos.
          </p>
        </Card>

        <Card title="Verificacion tecnica">
          <div className="module-list">
            {MODULES.map((module) => (
              <div className="module-item" key={module}>
                <span className="module-item__mark">OK</span>
                <span>{module}</span>
              </div>
            ))}
          </div>
        </Card>

        <SummaryCard
          title="Estado backend"
          subtitle="Resumen del proyecto reportado por la API"
          accent
          items={[
            { label: 'Proyecto', value: summary?.project || 'Huella Legal Forestal' },
            { label: 'Estado', value: summary?.backend_status || 'Pendiente', badge: true, color: summary?.backend_status === 'OK' ? 'var(--c-forest-600)' : 'var(--c-osinfor-ambar)' },
            { label: 'Modulos', value: implementedModules },
            { label: 'Sprints', value: summary?.implemented_sprints || '-' },
          ]}
          footer={
            summary ? (
              <CollapsibleJson title="Ver respuesta tecnica" data={summary} />
            ) : (
              <EmptyState
                title="Sin resumen cargado"
                message="Recarga el resumen para consultar el estado de la API."
              />
            )
          }
        />

        <SummaryCard
          title="Health check"
          subtitle="Disponibilidad del servicio backend"
          items={[
            { label: 'Estado', value: health?.status || 'OK', badge: true, color: (health?.status || 'OK') === 'OK' ? 'var(--c-forest-600)' : 'var(--c-danger-500)' },
            { label: 'Servicio', value: health?.service || health?.project || 'API' },
          ]}
          footer={
            health ? (
              <CollapsibleJson title="Ver respuesta tecnica" data={health} />
            ) : (
              <EmptyState
                title="Health no consultado"
                message="Ejecuta Verificar salud para confirmar disponibilidad si el endpoint esta activo."
              />
            )
          }
        />
      </div>
    </>
  );
}
