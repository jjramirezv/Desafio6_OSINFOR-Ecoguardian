import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import StepCard from '../components/common/StepCard.jsx';
import BatchSummaryCard from '../components/domain/BatchSummaryCard.jsx';
import { IMPORT_STEPS, useImportWorkflow } from '../hooks/useImportWorkflow.js';
import { RUN } from '../utils/statusHelpers.js';

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
  const responseEntries = Object.entries(workflow.responses).reverse();

  return (
    <>
      <SectionHeader
        title="Conector interoperable"
        subtitle="Flujo operacional sobre endpoints reales del backend."
        actions={
          <Button onClick={workflow.runAll} disabled={workflow.isBusy}>
            Ejecutar flujo completo
          </Button>
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

        <Card title="Evidencia tecnica por respuesta" className="col-span-2">
          {!responseEntries.length && (
            <EmptyState title="Sin respuestas" message="Ejecuta un paso para habilitar el detalle tecnico." />
          )}
          <div className="technical-list">
            {responseEntries.map(([key, response]) => (
              <CollapsibleJson
                key={key}
                title={`Ver respuesta tecnica - ${STEP_CONTENT[key]?.title || key}`}
                data={response}
              />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
