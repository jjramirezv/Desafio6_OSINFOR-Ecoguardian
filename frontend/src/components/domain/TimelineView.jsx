import EmptyState from '../common/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';

const EVENT_ICONS = {
  BATCH_CREATED: '+',
  NORMALIZED: 'N',
  PERSISTED: 'P',
  PROJECTED: 'G',
  ERROR: '!',
  SEARCHED: '?',
  NODE_VIEWED: '>',
};

function eventIcon(type) {
  return EVENT_ICONS[type] || '•';
}

function eventVariant(type) {
  if (type === 'ERROR') return 'danger';
  if (type === 'BATCH_CREATED' || type === 'PROJECTED') return 'success';
  if (type === 'NORMALIZED' || type === 'PERSISTED') return 'info';
  return 'default';
}

export default function TimelineView({ events = [], onSelect }) {
  if (!events.length) {
    return <EmptyState title="Sin eventos" message="No hay timeline para este lote." />;
  }

  return (
    <div className="timeline">
      {events.map((event, idx) => {
        const variant = eventVariant(event.event_type);
        return (
          <div
            key={event.id || idx}
            className={`timeline__item timeline__item--${variant}${event.nodeId && onSelect ? ' timeline__item--clickable' : ''}`}
            onClick={() => {
              if (event.nodeId && onSelect) {
                onSelect({ id: event.nodeId });
              }
            }}
          >
            <div className={`timeline__dot timeline__dot--${variant}`}>
              {eventIcon(event.event_type)}
            </div>
            <div className="timeline__connector" />
            <div className="timeline__body">
              <div className="timeline__header">
                <span className="timeline__type">{event.event_type}</span>
                <span className="timeline__time">{formatDateTime(event.created_at)}</span>
              </div>
              {event.description && (
                <p className="timeline__desc">{event.description}</p>
              )}
              {event.payload && Object.keys(event.payload).length > 0 && (
                <div className="timeline__payload">
                  {Object.entries(event.payload).map(([key, val]) => (
                    <span key={key} className="timeline__chip">
                      {key}: {String(val)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
