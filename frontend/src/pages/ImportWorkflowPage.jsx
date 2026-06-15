import { useState } from 'react';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import JsonViewer from '../components/common/JsonViewer.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import Table from '../components/common/Table.jsx';
import PipelineWizard from '../components/domain/PipelineWizard.jsx';
import ImportErrorsTable from '../components/domain/ImportErrorsTable.jsx';
import { useImportWorkflow, IMPORT_STEPS } from '../hooks/useImportWorkflow.js';
import { DISCLAIMER } from '../api/httpClient.js';
import { RUN } from '../utils/statusHelpers.js';
import { formatDateTime, humanizeKey } from '../utils/formatters.js';

const IMPORT_TYPE_OPTIONS = [
  { value: 'LIBRO_OPERACIONES_TALA', label: 'Libro Operaciones — Tala' },
  { value: 'LIBRO_OPERACIONES_TROZADO', label: 'Libro Operaciones — Trozado' },
  { value: 'LIBRO_OPERACIONES_DESPACHO', label: 'Libro Operaciones — Despacho' },
  { value: 'BALANCE_EXTRACCION', label: 'Balance de Extracción' },
  { value: 'GTF', label: 'Guía de Transporte Forestal (GTF)' },
  { value: 'CENSO_FORESTAL', label: 'Censo Forestal' },
];

const DETAIL_TABS = [
  { key: 'sourceRecords', label: 'Registros fuente' },
  { key: 'errors', label: 'Errores' },
  { key: 'operationalRecords', label: 'Registros operativos' },
  { key: 'log', label: 'Log de acciones' },
  { key: 'responses', label: 'Respuestas API' },
];

const SRC_RECORD_COLUMNS = [
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'external_id', label: 'ID externo' },
  { key: 'record_type', label: 'Tipo' },
  { key: 'status', label: 'Estado', render: (r) => <Badge status={r.status} /> },
];

const OPERATIONAL_COLUMNS = [
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'record_type', label: 'Tabla' },
  { key: 'record_count', label: 'Registros' },
  { key: 'status', label: 'Estado', render: (r) => <Badge status={r.status || 'ACTIVE'} /> },
];

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

function StepAction({ step, workflow }) {
  const state = workflow.steps[step.key] || RUN.IDLE;
  const isDisabled = !workflow.canRunStep(step);

  return (
    <button
      type="button"
      className={`pipeline-step-btn pipeline-step-btn--${state}`}
      disabled={isDisabled}
      onClick={() => workflow.runStep(step.key)}
    >
      <span className="pipeline-step-btn__icon">
        {state === RUN.RUNNING ? (
          <span className="spinner-sm" />
        ) : state === RUN.OK ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : state === RUN.ERROR ? (
          <span style={{ color: 'var(--c-danger-500)' }}>!</span>
        ) : (
          ICONS[step.key] || ICONS.play
        )}
      </span>
      <span className="pipeline-step-btn__label">{step.label}</span>
    </button>
  );
}

export default function ImportWorkflowPage({ onBatchChange }) {
  const workflow = useImportWorkflow({ onBatchChange });
  const [detailTab, setDetailTab] = useState('sourceRecords');

  return (
    <>
      <SectionHeader
        title="Conector interoperable"
        subtitle="Pipeline de importación demo: crea un lote, normaliza filas, persiste datos operativos y proyecta al grafo de trazabilidad."
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

      <p className="disclaimer">{DISCLAIMER}</p>

      {/* ---------- FORMULARIO DE CREACIÓN ---------- */}
      {!workflow.batch && (
        <Card title="Nuevo lote de importación" accent>
          <div className="form-grid">
            <label className="field">
              <span>Código de lote</span>
              <input
                value={workflow.form.batch_code}
                onChange={(e) => workflow.setForm((f) => ({ ...f, batch_code: e.target.value }))}
                placeholder="Ej. IMP-2026-001"
              />
            </label>
            <label className="field">
              <span>Nombre</span>
              <input
                value={workflow.form.name}
                onChange={(e) => workflow.setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Importación de demo"
              />
            </label>
            <label className="field">
              <span>Tipo de importación</span>
              <select
                value={workflow.form.import_type}
                onChange={(e) => workflow.form && workflow.setForm((f) => ({ ...f, import_type: e.target.value }))}
              >
                {IMPORT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <div className="field" style={{ alignSelf: 'end' }}>
              <Button block onClick={() => workflow.runStep('create')} disabled={workflow.isBusy}>
                {workflow.steps.create === RUN.RUNNING ? 'Creando…' : 'Crear lote'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ---------- PIPELINE + BATCH INFO ---------- */}
      {workflow.batch && (
        <div className="grid-2">
          <Card title="Pipeline de importación" accent>
            {workflow.lastError && (
              <div className="pipeline-error">
                <span className="pipeline-error__icon">!</span>
                <span>{workflow.lastError.message}</span>
              </div>
            )}
            <PipelineWizard
              steps={workflow.steps}
              activePhase={workflow.activePhase}
              onRunStep={workflow.runStep}
              canRunStep={workflow.canRunStep}
            />
          </Card>

          <Card
            title="Lote activo"
            actions={workflow.batch.status ? <Badge status={workflow.batch.status} size="lg" /> : null}
          >
            <div className="kv">
              <div className="kv__item">
                <span className="kv__key">ID</span>
                <span className="kv__value mono">#{workflow.batch.id}</span>
              </div>
              <div className="kv__item">
                <span className="kv__key">Código</span>
                <span className="kv__value mono">{workflow.batch.batch_code}</span>
              </div>
              <div className="kv__item kv__item--full">
                <span className="kv__key">Nombre</span>
                <span className="kv__value">{workflow.batch.name || '—'}</span>
              </div>
              <div className="kv__item kv__item--full">
                <span className="kv__key">Tipo</span>
                <span className="kv__value">{workflow.batch.import_type}</span>
              </div>
            </div>

            <div className="metrics" style={{ marginTop: 'var(--sp-4)' }}>
              <div className="metric">
                <div className="metric__value">{workflow.counters?.total_rows ?? 0}</div>
                <div className="metric__label">Filas totales</div>
              </div>
              <div className="metric">
                <div className="metric__value">{workflow.counters?.successful_rows ?? 0}</div>
                <div className="metric__label">OK</div>
              </div>
              <div className="metric metric--error">
                <div className="metric__value">{workflow.counters?.failed_rows ?? 0}</div>
                <div className="metric__label">Fallos</div>
              </div>
              <div className="metric">
                <div className="metric__value">{workflow.counters?.processed_rows ?? 0}</div>
                <div className="metric__label">Procesados</div>
              </div>
            </div>

            <div className="pipeline-actions" style={{ marginTop: 'var(--sp-4)' }}>
              <span className="text-sm muted">Pasos rápidos:</span>
              <div className="row">
                {IMPORT_STEPS.filter((s) => s.phase !== null).map((step) => (
                  <StepAction key={step.key} step={step} workflow={workflow} />
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------- PESTAÑAS DE DETALLE ---------- */}
      {workflow.batch && (
        <Card title="Detalle del pipeline">
          <div className="tabs">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tabs__btn ${detailTab === tab.key ? 'tabs__btn--active' : ''}`}
                onClick={() => setDetailTab(tab.key)}
              >
                {tab.label}
                {tab.key === 'errors' && workflow.errorRecords?.length > 0 && (
                  <span className="tabs__badge">{workflow.errorRecords.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {/* Source Records */}
            {detailTab === 'sourceRecords' && (
              <>
                {workflow.sourceRecords ? (
                  Array.isArray(workflow.sourceRecords) && workflow.sourceRecords.length > 0 ? (
                    <Table columns={SRC_RECORD_COLUMNS} rows={workflow.sourceRecords} keyExtractor={(r) => r.id} />
                  ) : (
                    <EmptyState title="Sin registros fuente" message="Ejecuta «Normalizar demo» primero." />
                  )
                ) : (
                  <EmptyState title="No consultado" message="Ejecuta el paso «Registros fuente»." />
                )}
              </>
            )}

            {/* Errors */}
            {detailTab === 'errors' && <ImportErrorsTable errors={workflow.errorRecords} />}

            {/* Operational Records */}
            {detailTab === 'operationalRecords' && (
              <>
                {workflow.operationalRecords ? (
                  Array.isArray(workflow.operationalRecords) && workflow.operationalRecords.length > 0 ? (
                    <Table
                      columns={OPERATIONAL_COLUMNS}
                      rows={workflow.operationalRecords}
                      keyExtractor={(r) => r.id || r.record_type}
                    />
                  ) : (
                    <EmptyState title="Sin registros operativos" message="Ejecuta «Persistir» primero." />
                  )
                ) : (
                  <EmptyState title="No consultado" message="Ejecuta el paso «Registros operativos»." />
                )}
              </>
            )}

            {/* Log */}
            {detailTab === 'log' && (
              <>
                {workflow.log.length > 0 ? (
                  <ul className="log">
                    {workflow.log.map((entry) => (
                      <li key={entry.id} className={`log__entry log__entry--${entry.level}`}>
                        <span className="log__time">{entry.time}</span>
                        <span className="log__msg">{entry.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="Sin acciones" message="El log aparecerá al ejecutar pasos del pipeline." />
                )}
              </>
            )}

            {/* Responses */}
            {detailTab === 'responses' && (
              <>
                {Object.keys(workflow.responses).length > 0 ? (
                  <div className="response-grid">
                    {Object.entries(workflow.responses).reverse().map(([key, resp]) => (
                      <article className="response-card" key={key}>
                        <div className="response-card__header">
                          <strong>{key}</strong>
                          {resp.message && <Badge variant="info">{resp.message}</Badge>}
                        </div>
                        <JsonViewer value={resp} />
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Sin respuestas" message="Ejecuta un paso para ver su respuesta." />
                )}
              </>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
