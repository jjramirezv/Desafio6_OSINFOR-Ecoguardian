import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import JsonViewer from '../components/common/JsonViewer.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import Table from '../components/common/Table.jsx';
import GraphVisualizer from '../components/domain/GraphVisualizer.jsx';
import { DISCLAIMER } from '../api/httpClient.js';

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

  return (
    <>
      <SectionHeader
        title="Panel General"
        subtitle="Estado del servicio, sistemas fuente registrados y grafo de evidencia semilla del caso CCNN Bélgica."
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
        </Card>
      </div>

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
          )}
        </Card>
      </div>
    </>
  );
}
