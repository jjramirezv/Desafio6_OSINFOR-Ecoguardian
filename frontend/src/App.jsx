import { useState, useCallback } from 'react';
import {
  api,
  DISCLAIMER,
  BASE_URL,
  DEMO_BATCH_BODY,
  DEMO_NORMALIZE_BODY,
} from './api.js';

// Estados posibles de cada paso del flujo.
const IDLE = 'idle';
const RUNNING = 'running';
const OK = 'ok';
const ERROR = 'error';

// Definicion ordenada del flujo. `requires` indica que dato previo necesita.
const STEPS = [
  { key: 'createBatch', label: '1. Crear lote demo', requires: null },
  { key: 'normalize', label: '2. Normalizar', requires: 'batchId' },
  { key: 'persist', label: '3. Persistir', requires: 'batchId' },
  { key: 'project', label: '4. Proyectar lote', requires: 'batchId' },
  { key: 'projectOperational', label: '5. Proyectar operativo', requires: 'batchId' },
  { key: 'runConsistency', label: '6. Ejecutar consistencia', requires: 'batchId' },
  { key: 'footprint', label: '7. Consultar huella', requires: 'batchId' },
  { key: 'snapshot', label: '8. Generar snapshot', requires: 'batchId' },
  { key: 'verify', label: '9. Verificar huella pública', requires: 'verificationCode' },
  { key: 'graph', label: '10. Consultar grafo', requires: 'batchId' },
];

function statusClass(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'TRACEABLE') return 'badge badge-traceable';
  if (s === 'OBSERVED') return 'badge badge-observed';
  if (s === 'INCOMPLETE') return 'badge badge-incomplete';
  if (s === 'ERROR') return 'badge badge-error';
  return 'badge badge-neutral';
}

function StepIcon({ state }) {
  if (state === RUNNING) return <span className="step-icon spin">◌</span>;
  if (state === OK) return <span className="step-icon ok">✓</span>;
  if (state === ERROR) return <span className="step-icon err">✕</span>;
  return <span className="step-icon idle">○</span>;
}

export default function App() {
  const [backend, setBackend] = useState(null);
  const [backendState, setBackendState] = useState(IDLE);

  const [batchId, setBatchId] = useState(null);
  const [batchCode, setBatchCode] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);

  const [footprint, setFootprint] = useState(null);
  const [verifyData, setVerifyData] = useState(null);
  const [graph, setGraph] = useState(null);

  const [stepStates, setStepStates] = useState({});
  const [log, setLog] = useState([]);

  const pushLog = useCallback((level, message) => {
    const time = new Date().toLocaleTimeString('es-PE');
    setLog((prev) => [{ time, level, message }, ...prev].slice(0, 60));
  }, []);

  const setStep = (key, state) =>
    setStepStates((prev) => ({ ...prev, [key]: state }));

  // ---- Backend ----
  const verifyBackend = async () => {
    setBackendState(RUNNING);
    pushLog('info', 'GET /demo/backend-summary');
    try {
      const res = await api.backendSummary();
      setBackend(res.data);
      setBackendState(OK);
      pushLog('ok', `Backend ${res.data.backend_status} — ${res.data.project}`);
    } catch (e) {
      setBackendState(ERROR);
      pushLog('error', e.message);
    }
  };

  // ---- Runner generico de cada paso ----
  const runStep = async (key) => {
    setStep(key, RUNNING);
    try {
      let res;
      switch (key) {
        case 'createBatch': {
          const body = { ...DEMO_BATCH_BODY };
          pushLog('info', `POST /import-batches (${body.batch_code})`);
          res = await api.createBatch(body);
          setBatchId(res.data.id);
          setBatchCode(res.data.batch_code);
          pushLog('ok', `Lote creado id=${res.data.id} code=${res.data.batch_code}`);
          break;
        }
        case 'normalize':
          pushLog('info', `POST /import-batches/${batchId}/normalize-demo`);
          res = await api.normalizeDemo(batchId, DEMO_NORMALIZE_BODY);
          pushLog('ok', res.message || 'Filas normalizadas');
          break;
        case 'persist':
          pushLog('info', `POST /import-batches/${batchId}/persist`);
          res = await api.persist(batchId);
          pushLog('ok', res.message || 'Registros persistidos');
          break;
        case 'project':
          pushLog('info', `POST /import-batches/${batchId}/project`);
          res = await api.project(batchId);
          pushLog('ok', res.message || 'Lote proyectado al grafo');
          break;
        case 'projectOperational':
          pushLog('info', `POST /import-batches/${batchId}/project-operational`);
          res = await api.projectOperational(batchId);
          pushLog('ok', res.message || 'Registros operativos proyectados');
          break;
        case 'runConsistency':
          pushLog('info', `POST /import-batches/${batchId}/run-consistency`);
          res = await api.runConsistency(batchId);
          pushLog('ok', res.message || 'Consistencia ejecutada');
          break;
        case 'footprint':
          pushLog('info', `GET /import-batches/${batchId}/legal-footprint/summary`);
          res = await api.legalFootprintSummary(batchId);
          setFootprint(res.data);
          pushLog('ok', `Huella: ${res.data.status} (score ${res.data.score})`);
          break;
        case 'snapshot':
          pushLog('info', `POST /import-batches/${batchId}/legal-footprint/snapshot`);
          res = await api.snapshot(batchId);
          setVerificationCode(res.data.verification_code);
          pushLog('ok', `Snapshot ${res.data.verification_code}`);
          break;
        case 'verify':
          pushLog('info', `GET /legal-footprints/verify/${verificationCode}`);
          res = await api.verify(verificationCode);
          setVerifyData(res.data);
          pushLog('ok', `Verificación pública: ${res.data.status}`);
          break;
        case 'graph':
          pushLog('info', `GET /import-batches/${batchId}/graph`);
          res = await api.graph(batchId);
          setGraph(res.data);
          pushLog(
            'ok',
            `Grafo: ${res.data.nodes?.length || 0} nodos / ${res.data.edges?.length || 0} relaciones`
          );
          break;
        default:
          throw new Error(`Paso desconocido: ${key}`);
      }
      setStep(key, OK);
    } catch (e) {
      setStep(key, ERROR);
      pushLog('error', `${key}: ${e.message}`);
    }
  };

  const stepDisabled = (step) => {
    if (stepStates[step.key] === RUNNING) return true;
    if (step.requires === 'batchId' && !batchId) return true;
    if (step.requires === 'verificationCode' && !verificationCode) return true;
    return false;
  };

  const runAll = async () => {
    for (const step of STEPS) {
      // Re-evaluar dependencias en cada iteracion (los datos se setean async).
      // eslint-disable-next-line no-await-in-loop
      await runStep(step.key);
    }
  };

  return (
    <div className="page">
      {/* HEADER */}
      <header className="header">
        <div>
          <h1>Huella Legal Forestal</h1>
          <p className="subtitle">
            Verificación técnica de trazabilidad y consistencia documental
          </p>
        </div>
        {backend && (
          <span className="badge badge-traceable big">
            Backend {backend.backend_status}
          </span>
        )}
      </header>

      <p className="disclaimer-top">{DISCLAIMER}</p>

      <div className="grid">
        {/* PANEL BACKEND */}
        <section className="card">
          <h2>Estado del backend</h2>
          <button className="btn btn-secondary" onClick={verifyBackend}>
            {backendState === RUNNING ? 'Verificando…' : 'Verificar backend'}
          </button>
          {backendState === ERROR && (
            <p className={statusClass('ERROR')} style={{ marginTop: 12 }}>
              Sin conexión
            </p>
          )}
          {backend && (
            <div className="kv">
              <div>
                <span className="k">Proyecto</span>
                <span className="v">{backend.project}</span>
              </div>
              <div>
                <span className="k">Estado</span>
                <span className="v">{backend.backend_status}</span>
              </div>
              <div>
                <span className="k">Sprints</span>
                <span className="v">{backend.implemented_sprints}</span>
              </div>
              <div className="full">
                <span className="k">Módulos</span>
                <div className="chips">
                  {backend.modules?.map((m) => (
                    <span key={m} className="chip">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <p className="disclaimer">{backend.disclaimer}</p>
            </div>
          )}
        </section>

        {/* FLUJO DEMO */}
        <section className="card">
          <div className="card-head">
            <h2>Flujo demo</h2>
            <button
              className="btn btn-ghost"
              onClick={runAll}
              title="Ejecutar todos los pasos en orden"
            >
              ▶ Ejecutar todo
            </button>
          </div>
          <div className="steps">
            {STEPS.map((step) => (
              <button
                key={step.key}
                className={`step step-${stepStates[step.key] || IDLE}`}
                disabled={stepDisabled(step)}
                onClick={() => runStep(step.key)}
              >
                <StepIcon state={stepStates[step.key] || IDLE} />
                <span className="step-label">{step.label}</span>
              </button>
            ))}
          </div>
          {batchId && (
            <p className="hint">
              Lote activo: <code>#{batchId}</code>{' '}
              {batchCode && <code>{batchCode}</code>}
            </p>
          )}
        </section>

        {/* PANEL HUELLA */}
        <section className="card">
          <h2>Huella legal</h2>
          {!footprint && <p className="muted">Aún sin consultar.</p>}
          {footprint && (
            <div className="kv">
              <div>
                <span className="k">batch_code</span>
                <span className="v">{footprint.batch_code}</span>
              </div>
              <div>
                <span className="k">Estado</span>
                <span className={statusClass(footprint.status)}>
                  {footprint.status}
                </span>
              </div>
              <div>
                <span className="k">Score</span>
                <span className="v">{footprint.score}</span>
              </div>
              <div className="full">
                <span className="k">Conteos</span>
                <div className="chips">
                  {footprint.counts &&
                    Object.entries(footprint.counts).map(([k, v]) => (
                      <span key={k} className="chip">
                        {k}: <b>{v}</b>
                      </span>
                    ))}
                </div>
              </div>
              <div className="full">
                <span className="k">Alertas</span>
                <div className="chips">
                  {footprint.alerts &&
                    Object.entries(footprint.alerts).map(([k, v]) => (
                      <span
                        key={k}
                        className={`chip ${v > 0 && (k === 'critical' || k === 'errors') ? 'chip-warn' : ''}`}
                      >
                        {k}: <b>{v}</b>
                      </span>
                    ))}
                </div>
              </div>
              <p className="message">{footprint.message}</p>
            </div>
          )}
        </section>

        {/* PANEL VERIFICACION PUBLICA */}
        <section className="card">
          <h2>Verificación pública</h2>
          {!verifyData && <p className="muted">Genera y verifica un snapshot.</p>}
          {verifyData && (
            <div className="kv">
              <div className="full">
                <span className="k">verification_code</span>
                <span className="v mono">{verifyData.verification_code}</span>
              </div>
              <div className="full">
                <span className="k">footprint_hash</span>
                <span className="v mono small">{verifyData.footprint_hash}</span>
              </div>
              <div>
                <span className="k">generated_at</span>
                <span className="v">{verifyData.generated_at}</span>
              </div>
              <div>
                <span className="k">Estado</span>
                <span className={statusClass(verifyData.status)}>
                  {verifyData.status}
                </span>
              </div>
              <div>
                <span className="k">Score</span>
                <span className="v">{verifyData.score}</span>
              </div>
              <p className="disclaimer">{verifyData.disclaimer || DISCLAIMER}</p>
            </div>
          )}
        </section>

        {/* PANEL GRAFO */}
        <section className="card card-wide">
          <h2>Grafo por lote</h2>
          {!graph && <p className="muted">Consulta el grafo del lote.</p>}
          {graph && (
            <div className="graph-tables">
              <div>
                <h3>
                  Nodos <span className="count">{graph.nodes?.length || 0}</span>
                </h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>id</th>
                        <th>type</th>
                        <th>label</th>
                        <th>status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {graph.nodes?.map((n) => (
                        <tr key={n.id}>
                          <td>{n.id}</td>
                          <td>{n.type}</td>
                          <td>{n.label}</td>
                          <td>
                            <span className={statusClass(n.status)}>
                              {n.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3>
                  Relaciones{' '}
                  <span className="count">{graph.edges?.length || 0}</span>
                </h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>source</th>
                        <th>relation</th>
                        <th>target</th>
                        <th>status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {graph.edges?.map((e) => (
                        <tr key={e.id}>
                          <td>{e.source}</td>
                          <td>{e.relation}</td>
                          <td>{e.target}</td>
                          <td>
                            <span className={statusClass(e.status)}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* PANEL LOG */}
        <section className="card card-wide">
          <h2>Log de ejecución</h2>
          {log.length === 0 && (
            <p className="muted">Las acciones ejecutadas aparecerán aquí.</p>
          )}
          <ul className="log">
            {log.map((entry, i) => (
              <li key={i} className={`log-${entry.level}`}>
                <span className="log-time">{entry.time}</span>
                <span className="log-msg">{entry.message}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="footer">
        <span>API: {BASE_URL}</span>
        <span>{DISCLAIMER}</span>
      </footer>
    </div>
  );
}
