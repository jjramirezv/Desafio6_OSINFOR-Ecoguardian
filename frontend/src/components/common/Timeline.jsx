import EmptyState from './EmptyState.jsx';
import CollapsibleJson from './CollapsibleJson.jsx';
import { formatDateTime } from '../../utils/formatters.js';

export default function Timeline({ events = [] }) {
  if (!events.length) {
    return <EmptyState title="Sin eventos" message="No hay eventos para mostrar." />;
  }

  return (
    <ul className="timeline">
      {events.map((event, index) => (
        <li className="timeline__item" key={event.id || `${event.event_type}-${index}`}>
          <span className="timeline__dot" />
          <div className="timeline__event">{event.event_type || event.type || 'Evento'}</div>
          <div className="timeline__time">
            {formatDateTime(event.created_at || event.generated_at || event.timestamp)}
          </div>
          {event.summary && <p className="timeline__summary">{event.summary}</p>}
          <CollapsibleJson
            title="Detalle tecnico JSON"
            data={event.payload || event}
            className="technical-detail--compact"
          />
        </li>
      ))}
    </ul>
  );
}
