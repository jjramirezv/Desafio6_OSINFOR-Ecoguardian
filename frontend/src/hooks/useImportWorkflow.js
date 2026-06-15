import { useCallback, useMemo, useState } from 'react';
import {
  DEMO_NORMALIZE_BODY,
  importBatchApi,
} from '../api/importBatchApi.js';
import { formatTime } from '../utils/formatters.js';
import { RUN } from '../utils/statusHelpers.js';

export const PIPELINE_PHASES = [
  { key: 'pending', label: 'Creado', desc: 'Lote registrado en BD' },
  { key: 'normalized', label: 'Normalizado', desc: 'Filas validadas como evidencia' },
  { key: 'persisted', label: 'Persistido', desc: 'Datos volcados a tablas operativas' },
  { key: 'projected', label: 'Proyectado', desc: 'Nodos y relaciones en el grafo' },
];

export const IMPORT_STEPS = [
  { key: 'create', label: '1. Crear lote', phase: 'pending', requiresBatch: false },
  { key: 'normalize', label: '2. Normalizar demo', phase: 'normalized', requiresBatch: true },
  { key: 'persist', label: '3. Persistir', phase: 'persisted', requiresBatch: true },
  { key: 'project', label: '4. Proyectar lote', phase: 'projected', requiresBatch: true },
  { key: 'projectOperational', label: '5. Proyectar operativos', phase: 'projected', requiresBatch: true },
  { key: 'summary', label: '6. Resumen', phase: null, requiresBatch: true },
  { key: 'sourceRecords', label: '7. Registros fuente', phase: null, requiresBatch: true },
  { key: 'errors', label: '8. Errores', phase: null, requiresBatch: true },
  { key: 'operationalRecords', label: '9. Registros operativos', phase: null, requiresBatch: true },
];

const DEFAULT_FORM = {
  batch_code: '',
  name: '',
  import_type: 'LIBRO_OPERACIONES_TALA',
};

export function useImportWorkflow({ onBatchChange } = {}) {
  const [batch, setBatch] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [responses, setResponses] = useState({});
  const [steps, setSteps] = useState({});
  const [log, setLog] = useState([]);
  const [lastError, setLastError] = useState(null);

  const [sourceRecords, setSourceRecords] = useState(null);
  const [errorRecords, setErrorRecords] = useState(null);
  const [operationalRecords, setOperationalRecords] = useState(null);

  const batchId = batch?.id;

  const pushLog = useCallback((level, message) => {
    setLog((current) =>
      [{ id: `${Date.now()}-${Math.random()}`, time: formatTime(), level, message }, ...current].slice(0, 80)
    );
  }, []);

  const setStep = useCallback((key, state) => {
    setSteps((current) => ({ ...current, [key]: state }));
  }, []);

  const rememberResponse = useCallback((key, response) => {
    setResponses((current) => ({
      ...current,
      [key]: {
        data: response?.data,
        message: response?.message,
        meta: response?.meta,
      },
    }));
  }, []);

  const refreshBatch = useCallback(async (id) => {
    const r = await importBatchApi.summary(id);
    setBatch(r.data);
    return r;
  }, []);

  const runStep = useCallback(async (key, forcedBatchId = batchId) => {
    const step = IMPORT_STEPS.find((s) => s.key === key);
    if (!step) return null;

    if (step.requiresBatch && !forcedBatchId) {
      const err = new Error('Primero crea un lote.');
      setLastError(err);
      pushLog('error', err.message);
      return null;
    }

    setStep(key, RUN.RUNNING);
    setLastError(null);

    try {
      let response;

      if (key === 'create') {
        const body = {
          organization_id: 1,
          source_system_id: 4,
          batch_code: form.batch_code || `IMP-DEMO-${Date.now()}`,
          name: form.name || 'Importación demo',
          import_type: form.import_type,
          source_file_name: 'demo.xlsx',
          source_file_path: 'imports/demo.xlsx',
          metadata: { demo: true },
        };
        pushLog('info', `POST /import-batches → ${body.batch_code}`);
        response = await importBatchApi.create(body);
        setBatch(response.data);
        onBatchChange?.(String(response.data.id));
      }

      if (key === 'normalize') {
        pushLog('info', `POST /import-batches/${forcedBatchId}/normalize-demo`);
        response = await importBatchApi.normalizeDemo(forcedBatchId, DEMO_NORMALIZE_BODY);
        await refreshBatch(forcedBatchId);
      }

      if (key === 'persist') {
        pushLog('info', `POST /import-batches/${forcedBatchId}/persist`);
        response = await importBatchApi.persist(forcedBatchId);
        await refreshBatch(forcedBatchId);
      }

      if (key === 'project') {
        pushLog('info', `POST /import-batches/${forcedBatchId}/project`);
        response = await importBatchApi.project(forcedBatchId);
        await refreshBatch(forcedBatchId);
      }

      if (key === 'projectOperational') {
        pushLog('info', `POST /import-batches/${forcedBatchId}/project-operational`);
        response = await importBatchApi.projectOperational(forcedBatchId);
        await refreshBatch(forcedBatchId);
      }

      if (key === 'summary') {
        pushLog('info', `GET /import-batches/${forcedBatchId}/summary`);
        response = await refreshBatch(forcedBatchId);
      }

      if (key === 'sourceRecords') {
        pushLog('info', `GET /import-batches/${forcedBatchId}/source-records`);
        response = await importBatchApi.sourceRecords(forcedBatchId);
        setSourceRecords(response.data);
      }

      if (key === 'errors') {
        pushLog('info', `GET /import-batches/${forcedBatchId}/errors`);
        response = await importBatchApi.errors(forcedBatchId);
        setErrorRecords(response.data);
      }

      if (key === 'operationalRecords') {
        pushLog('info', `GET /import-batches/${forcedBatchId}/operational-records`);
        response = await importBatchApi.operationalRecords(forcedBatchId);
        setOperationalRecords(response.data);
      }

      rememberResponse(key, response);
      setStep(key, RUN.OK);
      pushLog('ok', response?.message || `${step.label} completado`);
      return response;
    } catch (err) {
      setStep(key, RUN.ERROR);
      setLastError(err);
      pushLog('error', `${step.label}: ${err.message}`);
      return null;
    }
  }, [batchId, form, onBatchChange, pushLog, refreshBatch, rememberResponse, setStep]);

  const runAll = useCallback(async () => {
    let currentId = batchId;
    for (const s of IMPORT_STEPS) {
      if (s.requiresBatch && !currentId) break;
      const r = await runStep(s.key, currentId);
      if (!r) break;
      if (s.key === 'create' && r?.data?.id) currentId = r.data.id;
    }
  }, [batchId, runStep]);

  const canRunStep = useCallback((step) => {
    if (steps[step.key] === RUN.RUNNING) return false;
    if (step.requiresBatch && !batchId) return false;
    return true;
  }, [batchId, steps]);

  const isBusy = useMemo(
    () => Object.values(steps).some((s) => s === RUN.RUNNING),
    [steps]
  );

  /** Deriva la fase activa del pipeline según los steps completados. */
  const activePhase = useMemo(() => {
    if (steps.projectOperational === RUN.OK || steps.project === RUN.OK) return 'projected';
    if (steps.persist === RUN.OK) return 'persisted';
    if (steps.normalize === RUN.OK) return 'normalized';
    if (steps.create === RUN.OK) return 'pending';
    return null;
  }, [steps]);

  /** Resumen de contadores desde la respuesta del backend. */
  const counters = useMemo(() => {
    if (!batch) return null;
    const c = batch.counters || batch;
    return {
      total_rows: Number(c.total_rows) || 0,
      processed_rows: Number(c.processed_rows) || 0,
      successful_rows: Number(c.successful_rows) || 0,
      failed_rows: Number(c.failed_rows) || 0,
    };
  }, [batch]);

  const reset = useCallback(() => {
    setBatch(null);
    setForm(DEFAULT_FORM);
    setResponses({});
    setSteps({});
    setLog([]);
    setLastError(null);
    setSourceRecords(null);
    setErrorRecords(null);
    setOperationalRecords(null);
  }, []);

  return {
    batch,
    batchId,
    form,
    setForm,
    steps,
    activePhase,
    counters,
    responses,
    log,
    lastError,
    sourceRecords,
    errorRecords,
    operationalRecords,
    isBusy,
    runStep,
    runAll,
    canRunStep,
    refreshBatch,
    reset,
  };
}
