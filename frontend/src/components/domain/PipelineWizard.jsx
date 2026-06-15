import { PIPELINE_PHASES, IMPORT_STEPS } from '../../hooks/useImportWorkflow.js';
import { RUN } from '../../utils/statusHelpers.js';

function PhaseIcon({ state }) {
  if (state === RUN.RUNNING) return <span className="pipeline-phase__icon pipeline-phase__icon--running" />;
  if (state === RUN.OK) return (
    <span className="pipeline-phase__icon pipeline-phase__icon--ok">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
  if (state === RUN.ERROR) return <span className="pipeline-phase__icon pipeline-phase__icon--error">!</span>;
  return <span className="pipeline-phase__icon pipeline-phase__icon--idle">{/* circle */}</span>;
}

function StepIcon({ state }) {
  if (state === RUN.RUNNING) return <span className="pipeline-step__dot pipeline-step__dot--running" />;
  if (state === RUN.OK) return <span className="pipeline-step__dot pipeline-step__dot--ok">✓</span>;
  if (state === RUN.ERROR) return <span className="pipeline-step__dot pipeline-step__dot--error">!</span>;
  return <span className="pipeline-step__dot pipeline-step__dot--idle" />;
}

function getPhaseState(phaseKey, steps) {
  const phaseSteps = IMPORT_STEPS.filter((s) => s.phase === phaseKey);
  if (!phaseSteps.length) return RUN.IDLE;
  const allOk = phaseSteps.every((s) => steps[s.key] === RUN.OK);
  const anyError = phaseSteps.some((s) => steps[s.key] === RUN.ERROR);
  const anyRunning = phaseSteps.some((s) => steps[s.key] === RUN.RUNNING);
  const anyStarted = phaseSteps.some((s) => steps[s.key] && steps[s.key] !== RUN.IDLE);
  if (allOk) return RUN.OK;
  if (anyRunning) return RUN.RUNNING;
  if (anyError) return RUN.ERROR;
  if (anyStarted) return RUN.OK;
  return phaseSteps.every((s) => steps[s.key] === undefined || steps[s.key] === RUN.IDLE) && phaseKey === 'pending'
    ? (steps.create === RUN.OK ? RUN.OK : steps.create === RUN.ERROR ? RUN.ERROR : RUN.IDLE)
    : anyStarted ? RUN.OK : RUN.IDLE;
}

export default function PipelineWizard({ steps, activePhase, onRunStep, canRunStep }) {
  const phaseStates = {};
  PIPELINE_PHASES.forEach((ph) => {
    phaseStates[ph.key] = getPhaseState(ph.key, steps);
  });

  return (
    <div className="pipeline">
      <div className="pipeline__track">
        {PIPELINE_PHASES.map((ph, idx) => {
          const state = phaseStates[ph.key];
          const isActive = activePhase === ph.key;
          const isLast = idx === PIPELINE_PHASES.length - 1;

          const phaseSteps = IMPORT_STEPS.filter((s) => s.phase === ph.key);

          return (
            <div
              key={ph.key}
              className={`pipeline-phase ${isActive ? 'pipeline-phase--active' : ''} pipeline-phase--${state}`}
            >
              <PhaseIcon state={state} />

              <div className="pipeline-phase__body">
                <span className="pipeline-phase__label">{ph.label}</span>
                <span className="pipeline-phase__desc">{ph.desc}</span>

                {phaseSteps.length > 0 && (
                  <div className="pipeline-phase__steps">
                    {phaseSteps.map((s) => {
                      const sState = steps[s.key] || RUN.IDLE;
                      return (
                        <button
                          key={s.key}
                          type="button"
                          className={`pipeline-step pipeline-step--${sState}`}
                          disabled={!canRunStep(s)}
                          onClick={() => onRunStep(s.key)}
                        >
                          <StepIcon state={sState} />
                          <span className="pipeline-step__label">{s.label.replace(/^\d+\.\s*/, '')}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!isLast && <div className="pipeline-phase__connector" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
