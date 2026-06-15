import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import StepCard from '../components/common/StepCard.jsx';
import SummaryCard from '../components/common/SummaryCard.jsx';
import BatchSummaryCard from '../components/domain/BatchSummaryCard.jsx';
import { IMPORT_STEPS, useImportWorkflow } from '../hooks/useImportWorkflow.js';
import { RUN } from '../utils/statusHelpers.js';
import { formatDateTime, humanizeKey } from '../utils/formatters.js';

const ICONS = {
  create: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  normalize: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  persist: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4l6 3 6-3M2 8l6 3 6-3M2 12l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  project: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="5" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8h2M9.5 6.5l.5-1M9.5 9.5l.5 1" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2l10 6-10 6V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  reset: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8a6 6 0 0110.47-4M14 8a6 6 0 01-10.47 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const STEP_CONTENT = {
  create: {
    title: 'Crear lote',
    description: 'Registra el lote de importacion que agrupa la evidencia.',
    action: 'Crear lote',
    result: 'Lote creado correctamente',
  },
  normalize: {
    title: 'Normalizar datos',
    description: 'Transforma filas demo al formato interoperable esperado.',
    action: 'Normalizar',
    result: 'Registros normalizados',
  },
  persist: {
    title: 'Persistir registros',
    description: 'Guarda registros fuente y errores reportados por backend.',
    action: 'Persistir',
    result: 'Registros persistidos',
  },
  project: {
    title: 'Proyectar lote',
    description: 'Crea nodos y relaciones base para trazabilidad.',
    action: 'Proyectar lote',
    result: 'Grafo proyectado',
  },
  projectOperational: {
    title: 'Proyectar operaciones',
    description: 'Integra registros operativos al grafo de evidencia.',
    action: 'Proyectar operaciones',
    result: 'Operaciones proyectadas',
  },
  summary: {
    title: 'Consultar resumen',
    description: 'Actualiza contadores, estado y metadatos del lote.',
    action: 'Consultar resumen',
    result: 'Resumen actualizado',
  },
  sourceRecords: {
    title: 'Consultar registros',
    description: 'Lista registros fuente vinculados al lote.',
    action: 'Consultar registros',
    result: 'Registros consultados',
  },
  errors: {
    title: 'Consultar errores',
    description: 'Revisa errores de normalizacion o persistencia.',
    action: 'Consultar errores',
    result: 'Errores consultados',
  },
  operationalRecords: {
    title: 'Consultar operaciones',
    description: 'Lista registros operativos proyectados por el backend.',
    action: 'Consultar operaciones',
    result: 'Operaciones consultadas',
  },
};

function responseLabel(key, response) {
  if (!response) return '';
  if (response.message) return response.message;
  const data = response.data;
  if (Array.isArray(data)) return `${data.length} registros devueltos`;
  if (data?.id) return `${STEP_CONTENT[key]?.result || 'Paso ejecutado'} (#${data.id})`;
  return STEP_CONTENT[key]?.result || 'Paso ejecutado correctamente';
}

export default function ImportWorkflowPage({ onBatchChange }) {
  const workflow = useImportWorkflow({ onBatchChange });

  const responseEntries = Object.entries(workflow.responses || {}).filter(
    ([, r]) => r !== undefined && r !== null
  );

  return (
    <>
      <SectionHeader
        title="Conector interoperable"
        subtitle="Flujo operacional sobre endpoints reales del backend."
        actions={
          <div className="row">
            {workflow.batch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={workflow.reset}
                disabled={workflow.isBusy}
              >
                {ICONS.reset} Nuevo lote
              </Button>
            )}
            <Button
              onClick={workflow.runAll}
              disabled={workflow.isBusy || (!workflow.batch && !workflow.form.batch_code)}
            >
              {ICONS.play} Ejecutar todo
            </Button>
          </div>
        }
      />

      {workflow.lastError && (
        <EmptyState
          variant="error"
          title="Ultimo error"
          message={workflow.lastError.message}
        />
      )}

      <div className="grid-2">
        <BatchSummaryCard batch={workflow.batch} />

        <Card title="Actividad reciente">
          {!workflow.log.length && (
            <EmptyState title="Sin acciones" message="El registro aparecera al ejecutar el flujo." />
          )}
          <ul className="log">
            {workflow.log.slice(0, 8).map((entry) => (
              <li key={entry.id} className={`log__entry log__entry--${entry.level}`}>
                <span className="log__time">{entry.time}</span>
                <span className="log__msg">{entry.message}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Flujo de proceso" className="col-span-2">
          <div className="step-grid">
            {IMPORT_STEPS.map((step, index) => {
              const state = workflow.steps[step.key] || RUN.IDLE;
              const content = STEP_CONTENT[step.key];
              const response = workflow.responses[step.key];
              return (
                <StepCard
                  key={step.key}
                  number={index + 1}
                  title={content.title}
                  description={content.description}
                  state={state}
                  actionLabel={content.action}
                  disabled={!workflow.canRunStep(step)}
                  onRun={() => workflow.runStep(step.key)}
                  result={responseLabel(step.key, response)}
                  time={response?.completedAt}
                  technicalData={response}
                />
              );
            })}
          </div>
        </Card>

        <SummaryCard
          title="Evidencia tecnica por respuesta"
          subtitle="Detalle JSON de cada paso ejecutado"
          accent
          className="col-span-2"
          footer={
            !responseEntries.length ? (
              <EmptyState title="Sin respuestas" message="Ejecuta un paso para habilitar el detalle tecnico." />
            ) : (
              <div className="technical-list">
                {responseEntries.map(([key, response]) => (
                  <CollapsibleJson
                    key={key}
                    title={`Ver respuesta tecnica - ${STEP_CONTENT[key]?.title || key}`}
                    data={response}
                  />
                ))}
              </div>
            )
          }
        />
      </div>
    </>
  );
}
