import Badge from './Badge.jsx';
import Button from './Button.jsx';
import CollapsibleJson from './CollapsibleJson.jsx';
import { RUN } from '../../utils/statusHelpers.js';

const RUN_LABELS = {
  [RUN.IDLE]: 'Pendiente',
  [RUN.RUNNING]: 'Ejecutando',
  [RUN.OK]: 'Ejecutado',
  [RUN.ERROR]: 'Error',
};

const RUN_VARIANTS = {
  [RUN.IDLE]: 'neutral',
  [RUN.RUNNING]: 'info',
  [RUN.OK]: 'success',
  [RUN.ERROR]: 'danger',
};

export default function StepCard({
  number,
  title,
  description,
  state = RUN.IDLE,
  actionLabel,
  disabled,
  onRun,
  result,
  time,
  technicalData,
}) {
  const isRunning = state === RUN.RUNNING;

  return (
    <article className={`step-card step-card--${state}`}>
      <div className="step-card__number">{number}</div>
      <div className="step-card__content">
        <div className="step-card__topline">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <Badge variant={RUN_VARIANTS[state]}>{RUN_LABELS[state]}</Badge>
        </div>
        <div className="step-card__meta">
          <span>{result || 'Sin ejecucion registrada'}</span>
          {time && <span className="mono">{time}</span>}
        </div>
        <div className="step-card__actions">
          <Button size="sm" onClick={onRun} disabled={disabled || isRunning}>
            {isRunning ? 'Ejecutando...' : actionLabel}
          </Button>
          <CollapsibleJson title="Ver respuesta tecnica" data={technicalData} />
        </div>
      </div>
    </article>
  );
}
