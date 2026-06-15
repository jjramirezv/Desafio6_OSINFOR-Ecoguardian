import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import MetricCard from '../components/common/MetricCard.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import Table from '../components/common/Table.jsx';
import GraphVisualizer from '../components/domain/GraphVisualizer.jsx';
import { DISCLAIMER } from '../api/httpClient.js';

<<<<<<< HEAD
const SOURCE_SYSTEM_COLUMNS = [
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'type', label: 'Tipo' },
  {
    key: 'integration_type',
    label: 'Integración',
    render: (row) => row.integration_type || '—',
  },
  {
    key: 'status',
    label: 'Estado',
    render: (row) => <Badge status={row.status} />,
  },
=======
const MODULES = [
  'Conector interoperable',
  'Trazabilidad',
  'Huella legal',
  'Alertas',
  'Verificacion publica',
  'Resumen operativo',
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
];

export default function DashboardPage({ backend }) {
  const {
    summary,
    health,
    sourceSystems,
    graphSeed,
    loadingSummary,
    checkingHealth,
    loadingSourceSystems,
    loadingGraphSeed,
    error,
    healthError,
    sourceSystemsError,
    graphSeedError,
    loadSummary,
    checkHealth,
    loadSourceSystems,
    loadGraphSeed,
  } = backend;

  const implementedModules = Array.isArray(summary?.modules)
    ? summary.modules.length
    : MODULES.length;

  return (
    <>
      <SectionHeader
<<<<<<< HEAD
        title="Panel General"
        subtitle="Estado del servicio, sistemas fuente registrados y grafo de evidencia semilla del caso CCNN Bélgica."
=======
        title="Huella Legal Forestal"
        subtitle="Plataforma institucional para trazabilidad forestal, consistencia documental y verificacion tecnica."
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
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

      <p className="disclaimer">{DISCLAIMER}</p>

<<<<<<< HEAD
      {/* --- Fila de métricas rápidas --- */}
      <div className="metrics">
        <div className={`metric ${health?.status === 'ok' ? 'metric--ok' : 'metric--error'}`}>
          <div className="metric__value">{health?.status === 'ok' ? 'OK' : '—'}</div>
          <div className="metric__label">Salud del servicio</div>
        </div>
        <div className="metric metric--ok">
          <div className="metric__value">{summary?.implemented_sprints ?? '—'}</div>
          <div className="metric__label">Sprints implementados</div>
        </div>
        <div className={`metric ${sourceSystems ? 'metric--ok' : 'metric--warning'}`}>
          <div className="metric__value">{Array.isArray(sourceSystems) ? sourceSystems.length : '—'}</div>
          <div className="metric__label">Sistemas fuente</div>
        </div>
        <div className={`metric ${graphSeed?.nodes ? 'metric--ok' : 'metric--warning'}`}>
          <div className="metric__value">{graphSeed?.nodes?.length ?? '—'}</div>
          <div className="metric__label">Nodos del grafo</div>
        </div>
        <div className={`metric ${graphSeed?.edges ? 'metric--ok' : 'metric--warning'}`}>
          <div className="metric__value">{graphSeed?.edges?.length ?? '—'}</div>
          <div className="metric__label">Relaciones del grafo</div>
        </div>
      </div>

      {/* --- Health + Backend Summary --- */}
      <div className="grid-2">
        <Card
          title="Estado del backend"
          actions={health?.status === 'ok' ? <Badge status="ok" /> : null}
          accent
        >
          {health === null && healthError === null && (
            <LoadingState label="Verificando salud..." />
          )}
          {healthError && (
            <EmptyState
              variant="error"
              title="Error de conexión"
              message={healthError.message}
            />
          )}
          {health && (
            <div className="kv">
              <div className="kv__item">
                <span className="kv__key">Servicio</span>
                <span className="kv__value">{health.service}</span>
              </div>
              <div className="kv__item">
                <span className="kv__key">Versión</span>
                <span className="kv__value mono">{health.version}</span>
              </div>
              <div className="kv__item">
                <span className="kv__key">Entorno</span>
                <span className="kv__value">{health.environment}</span>
              </div>
              <div className="kv__item">
                <span className="kv__key">Estado</span>
                <span className="kv__value">
                  <Badge status={health.status} />
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Resumen del proyecto"
          actions={summary?.backend_status ? <Badge status={summary.backend_status} /> : null}
          accent
        >
          {loadingSummary && <LoadingState label="Cargando resumen..." />}
          {error && (
            <EmptyState
              variant="error"
              title="No se pudo cargar el resumen"
              message={error.message}
            />
          )}
          {summary && (
            <div className="kv">
              <div className="kv__item kv__item--full">
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
                <span className="kv__key">Sprints</span>
                <span className="kv__value">{summary.implemented_sprints}</span>
              </div>
              {summary.modules?.length > 0 && (
                <div className="kv__item kv__item--full">
                  <span className="kv__key">Módulos</span>
                  <div className="chips">
                    {summary.modules.map((mod) => (
                      <span className="chip" key={mod}>{mod}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
=======
      {(loadingSummary || checkingHealth) && (
        <LoadingState label="Consultando estado del backend..." />
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
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
        </Card>
      </div>

<<<<<<< HEAD
      {/* --- Sistemas Fuente --- */}
      <Card
        title="Sistemas Fuente"
        actions={
          <Button variant="ghost" size="sm" onClick={loadSourceSystems} disabled={loadingSourceSystems}>
            {loadingSourceSystems ? 'Cargando...' : 'Recargar'}
          </Button>
        }
      >
        {loadingSourceSystems && <LoadingState label="Cargando sistemas fuente..." />}
        {sourceSystemsError && (
          <EmptyState
            variant="error"
            title="Error al cargar sistemas fuente"
            message={sourceSystemsError.message}
          />
        )}
        {Array.isArray(sourceSystems) && sourceSystems.length > 0 ? (
          <Table
            columns={SOURCE_SYSTEM_COLUMNS}
            rows={sourceSystems}
            keyExtractor={(row) => row.id}
          />
        ) : (
          !loadingSourceSystems && !sourceSystemsError && (
            <EmptyState title="Sin sistemas fuente" message="No se encontraron sistemas fuente registrados." />
          )
        )}
      </Card>

      {/* --- Grafo de Evidencia --- */}
      <Card
        title="Grafo de Evidencia — CCNN Bélgica"
        actions={
          <Button variant="ghost" size="sm" onClick={loadGraphSeed} disabled={loadingGraphSeed}>
            {loadingGraphSeed ? 'Cargando...' : 'Recargar grafo'}
          </Button>
        }
      >
        {loadingGraphSeed && <LoadingState label="Cargando grafo semilla..." />}
        {graphSeedError && (
          <EmptyState
            variant="error"
            title="Error al cargar el grafo"
            message={graphSeedError.message}
          />
        )}
        {graphSeed ? (
          <GraphVisualizer
            nodes={graphSeed.nodes || []}
            edges={graphSeed.edges || []}
          />
        ) : (
          !loadingGraphSeed && !graphSeedError && (
            <EmptyState title="Grafo no disponible" message="Ejecuta el seed del backend para generar el grafo de evidencia." />
          )
        )}
      </Card>

      {/* --- JSON responses en acordeón compacto --- */}
      <div className="grid-2">
        <Card title="Respuesta /health" compact>
          {health ? (
            <JsonViewer value={health} />
          ) : (
            <EmptyState title="Sin datos" />
          )}
        </Card>

        <Card title="Respuesta backend-summary" compact>
          {summary ? (
            <JsonViewer value={summary} />
          ) : (
            <EmptyState title="Sin datos" />
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Respuesta source-systems" compact>
          {sourceSystems ? (
            <JsonViewer value={sourceSystems} />
          ) : (
            <EmptyState title="Sin datos" />
          )}
        </Card>

        <Card title="Respuesta graph/seed" compact>
          {graphSeed ? (
            <JsonViewer value={graphSeed} />
          ) : (
            <EmptyState title="Sin datos" />
=======
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

        <Card
          title="Estado backend"
          actions={summary?.backend_status ? <Badge status={summary.backend_status} /> : null}
          className="col-span-2"
        >
          {summary ? (
            <div className="stack">
              <div className="kv">
                <div className="kv__item">
                  <span className="kv__key">Proyecto</span>
                  <span className="kv__value">{summary.project || 'Huella Legal Forestal'}</span>
                </div>
                <div className="kv__item">
                  <span className="kv__key">Estado</span>
                  <span className="kv__value">
                    <Badge status={summary.backend_status} />
                  </span>
                </div>
              </div>
              <CollapsibleJson title="Ver respuesta tecnica" data={summary} />
            </div>
          ) : (
            <EmptyState
              title="Sin resumen cargado"
              message="Recarga el resumen para consultar el estado de la API."
            />
          )}
        </Card>

        <Card title="Health check" className="col-span-2">
          {health ? (
            <div className="stack">
              <div className="kv">
                <div className="kv__item">
                  <span className="kv__key">Estado</span>
                  <span className="kv__value">
                    <Badge status={health.status || 'OK'} />
                  </span>
                </div>
                <div className="kv__item">
                  <span className="kv__key">Servicio</span>
                  <span className="kv__value">{health.service || health.project || 'API'}</span>
                </div>
              </div>
              <CollapsibleJson title="Ver respuesta tecnica" data={health} />
            </div>
          ) : (
            <EmptyState
              title="Health no consultado"
              message="Ejecuta Verificar salud para confirmar disponibilidad si el endpoint esta activo."
            />
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
          )}
        </Card>
      </div>
    </>
  );
}
