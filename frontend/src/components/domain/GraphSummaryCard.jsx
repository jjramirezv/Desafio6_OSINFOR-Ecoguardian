import Card from '../common/Card.jsx';
import MetricCard from '../common/MetricCard.jsx';
import { toCount } from '../../utils/formatters.js';

export default function GraphSummaryCard({ graph, timeline = [] }) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];

  return (
    <Card title="Resumen del grafo" accent className="col-span-2">
      <div className="grid-3">
        <MetricCard
          title="Nodos"
          value={toCount(nodes.length)}
          detail="Entidades y documentos trazables"
        />
        <MetricCard
          title="Relaciones"
          value={toCount(edges.length)}
          detail="Vinculos entre evidencias"
        />
        <MetricCard
          title="Eventos timeline"
          value={toCount(timeline.length)}
          detail="Cambios registrados por el backend"
        />
      </div>
    </Card>
  );
}
