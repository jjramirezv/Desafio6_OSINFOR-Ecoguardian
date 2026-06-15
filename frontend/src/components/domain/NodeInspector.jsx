import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { humanizeKey } from '../../utils/formatters.js';

function MetadataTable({ data }) {
  if (!data) return null;
  return (
    <div className="inspector__meta">
      {Object.entries(data).map(([key, val]) => {
        if (key === 'id' || key === 'neighbors') return null;
        return (
          <div key={key} className="inspector__field">
            <span className="inspector__field-key">{humanizeKey(key)}</span>
            <span className="inspector__field-value">
              {val === null || val === undefined ? '—' : String(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function NeighborList({ neighbors, title, onSelect }) {
  if (!neighbors?.length) return null;
  return (
    <div className="inspector__neighbors">
      <h4 className="inspector__subtitle">{title} ({neighbors.length})</h4>
      <div className="inspector__neighbor-list">
        {neighbors.map((n) => (
          <div key={n.id || n.node_id} className="inspector__neighbor-item">
            <div className="inspector__neighbor-info">
              <span className="inspector__neighbor-label">
                {n.label || n.name || `Nodo ${n.id || n.node_id}`}
              </span>
              <Badge status={n.type || n.node_type} />
            </div>
            {onSelect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelect(n)}
              >
                Ver
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NodeInspector({ node, neighbors, onSelect, onClose }) {
  if (!node) {
    return (
      <div className="inspector inspector--empty">
        <EmptyState
          title="Sin nodo seleccionado"
          message="Haz clic en un nodo del grafo o en resultados de búsqueda para inspeccionarlo."
        />
      </div>
    );
  }

  const incoming = neighbors?.incoming || neighbors?.incoming_edges || [];
  const outgoing = neighbors?.outgoing || neighbors?.outgoing_edges || [];

  return (
    <div className="inspector">
      <div className="inspector__header">
        <div className="inspector__title-group">
          <h3 className="inspector__title">{node.label || node.name || `Nodo ${node.id}`}</h3>
          <Badge status={node.type || node.node_type} />
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      <div className="inspector__id">ID: {node.id}</div>

      <MetadataTable data={node} />

      {neighbors && (
        <div className="inspector__neighbors-section">
          <NeighborList
            neighbors={incoming}
            title="Relaciones entrantes"
            onSelect={onSelect}
          />
          <NeighborList
            neighbors={outgoing}
            title="Relaciones salientes"
            onSelect={onSelect}
          />
        </div>
      )}
    </div>
  );
}
