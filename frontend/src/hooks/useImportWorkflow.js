import { useCallback, useMemo, useState } from 'react';
import {
  DEMO_NORMALIZE_BODY,
  buildDemoBatchBody,
  importBatchApi,
} from '../api/importBatchApi.js';
import { formatTime } from '../utils/formatters.js';
import { RUN } from '../utils/statusHelpers.js';

export const IMPORT_STEPS = [
  { key: 'create', label: '1. Crear lote demo', requiresBatch: false },
  { key: 'normalize', label: '2. Normalizar demo', requiresBatch: true },
  { key: 'persist', label: '3. Persistir', requiresBatch: true },
  { key: 'project', label: '4. Proyectar lote', requiresBatch: true },
  {
    key: 'projectOperational',
    label: '5. Proyectar registros operativos',
    requiresBatch: true,
  },
  { key: 'summary', label: '6. Consultar resumen', requiresBatch: true },
  { key: 'sourceRecords', label: '7. Consultar registros fuente', requiresBatch: true },
  { key: 'errors', label: '8. Consultar errores', requiresBatch: true },
  {
    key: 'operationalRecords',
    label: '9. Consultar registros operativos',
    requiresBatch: true,
  },
];

export function useImportWorkflow({ onBatchChange } = {}) {
  const [batch, setBatch] = useState(null);
  const [responses, setResponses] = useState({});
  const [steps, setSteps] = useState({});
  const [log, setLog] = useState([]);
  const [lastError, setLastError] = useState(null);

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

  const refreshSummary = useCallback(
    async (id) => {
      const response = await importBatchApi.summary(id);
      setBatch(response.data);
      rememberResponse('summary', response);
      return response;
    },
    [rememberResponse]
  );

  const runStep = useCallback(
    async (key, forcedBatchId = batchId) => {
      const step = IMPORT_STEPS.find((item) => item.key === key);
      if (!step) return null;

      if (step.requiresBatch && !forcedBatchId) {
        const error = new Error('Primero crea un lote demo.');
        setLastError(error);
        pushLog('error', error.message);
        return null;
      }

      setStep(key, RUN.RUNNING);
      setLastError(null);

      try {
        let response;

        if (key === 'create') {
          const body = buildDemoBatchBody();
          pushLog('info', `POST /import-batches (${body.batch_code})`);
          response = await importBatchApi.create(body);
          setBatch(response.data);
          onBatchChange?.(String(response.data.id));
        }

        if (key === 'normalize') {
          pushLog('info', `POST /import-batches/${forcedBatchId}/normalize-demo`);
          response = await importBatchApi.normalizeDemo(forcedBatchId, DEMO_NORMALIZE_BODY);
          await refreshSummary(forcedBatchId);
        }

        if (key === 'persist') {
          pushLog('info', `POST /import-batches/${forcedBatchId}/persist`);
          response = await importBatchApi.persist(forcedBatchId);
          await refreshSummary(forcedBatchId);
        }

        if (key === 'project') {
          pushLog('info', `POST /import-batches/${forcedBatchId}/project`);
          response = await importBatchApi.project(forcedBatchId);
          await refreshSummary(forcedBatchId);
        }

        if (key === 'projectOperational') {
          pushLog('info', `POST /import-batches/${forcedBatchId}/project-operational`);
          response = await importBatchApi.projectOperational(forcedBatchId);
          await refreshSummary(forcedBatchId);
        }

        if (key === 'summary') {
          pushLog('info', `GET /import-batches/${forcedBatchId}/summary`);
          response = await refreshSummary(forcedBatchId);
        }

        if (key === 'sourceRecords') {
          pushLog('info', `GET /import-batches/${forcedBatchId}/source-records`);
          response = await importBatchApi.sourceRecords(forcedBatchId);
        }

        if (key === 'errors') {
          pushLog('info', `GET /import-batches/${forcedBatchId}/errors`);
          response = await importBatchApi.errors(forcedBatchId);
        }

        if (key === 'operationalRecords') {
          pushLog('info', `GET /import-batches/${forcedBatchId}/operational-records`);
          response = await importBatchApi.operationalRecords(forcedBatchId);
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
    },
    [batchId, onBatchChange, pushLog, refreshSummary, rememberResponse, setStep]
  );

  const runAll = useCallback(async () => {
    let currentBatchId = batchId;

    for (const step of IMPORT_STEPS) {
      if (step.requiresBatch && !currentBatchId) break;
      const response = await runStep(step.key, currentBatchId);
      if (!response) break;
      if (step.key === 'create' && response?.data?.id) {
        currentBatchId = response.data.id;
      }
    }
  }, [batchId, runStep]);

  const canRunStep = useCallback(
    (step) => {
      if (steps[step.key] === RUN.RUNNING) return false;
      if (step.requiresBatch && !batchId) return false;
      return true;
    },
    [batchId, steps]
  );

  const isBusy = useMemo(
    () => Object.values(steps).some((state) => state === RUN.RUNNING),
    [steps]
  );

  return {
    batch,
    batchId,
    responses,
    steps,
    log,
    lastError,
    isBusy,
    runStep,
    runAll,
    canRunStep,
  };
}
