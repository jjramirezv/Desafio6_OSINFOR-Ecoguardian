import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import JsonViewer from '../components/common/JsonViewer.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import ImportBatchCard from '../components/domain/ImportBatchCard.jsx';
import { IMPORT_STEPS, useImportWorkflow } from '../hooks/useImportWorkflow.js';
import { RUN } from '../utils/statusHelpers.js';

function StepIcon({ state }) {
  if (state === RUN.RUNNING) return <span className="step__icon step__icon--running">...</span>;
  if (state === RUN.OK) return <span className="step__icon step__icon--ok">OK</span>;
  if (state === RUN.ERROR) return <span className="step__icon step__icon--error">!</span>;
  return <span className="step__icon step__icon--idle">-</span>;
}

export default function ImportWorkflowPage({ onBatchChange }) {
  const workflow = useImportWorkflow({ onBatchChange });
  const responseEntries = Object.entries(workflow.responses).reverse();

  return (
    <>
      <SectionHeader
        title="Flujo de importación demo"
        subtitle="Ejecuta endpoints reales del conector. Los errores del backend se muestran sin simular éxito."
        actions={
          <Button onClick={workflow.runAll} disabled={workflow.isBusy}>
            Ejecutar flujo completo
          </Button>
        }
      />

      {workflow.lastError && (
        <EmptyState
          variant="error"
          title="Último error"
          message={workflow.lastError.message}
        />
      )}

      <div className="grid-2">
        <ImportBatchCard batch={workflow.batch} />

        <Card title="Pasos del flujo">
          <div className="steps">
            {IMPORT_STEPS.map((step) => {
              const state = workflow.steps[step.key] || RUN.IDLE;
              return (
                <button
                  key={step.key}
                  type="button"
                  className={`step step--${state}`}
                  disabled={!workflow.canRunStep(step)}
                  onClick={() => workflow.runStep(step.key)}
                >
                  <StepIcon state={state} />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Respuestas resumidas" className="col-span-2">
          {!responseEntries.length && (
            <EmptyState title="Sin respuestas" message="Ejecuta un paso para ver su respuesta." />
          )}
          <div className="response-grid">
            {responseEntries.map(([key, response]) => (
              <article className="response-card" key={key}>
                <div className="response-card__header">
                  <strong>{key}</strong>
                  {response.message && <Badge variant="info">{response.message}</Badge>}
                </div>
                <JsonViewer value={response} />
              </article>
            ))}
          </div>
        </Card>

        <Card title="Log de acciones" className="col-span-2">
          {!workflow.log.length && (
            <EmptyState title="Sin acciones" message="El log aparecerá al ejecutar el flujo." />
          )}
          <ul className="log">
            {workflow.log.map((entry) => (
              <li key={entry.id} className={`log__entry log__entry--${entry.level}`}>
                <span className="log__time">{entry.time}</span>
                <span className="log__msg">{entry.message}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
