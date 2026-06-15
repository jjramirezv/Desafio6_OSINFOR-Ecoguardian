// Tablas de dominio para el grafo de trazabilidad: nodos y relaciones.
// Reutilizable tanto para el grafo del lote como para resultados de busqueda
// y vecindarios. Permite seleccionar un nodo (para consultar vecinos).

import Badge from '../common/Badge.jsx';
import EmptyState from '../common/EmptyState.jsx';

export function NodesTable({ nodes = [], selectedId = null, onSelect }) {
  if (!nodes.length) {
    return <EmptyState title="Sin nodos" message="No hay nodos para mostrar." />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Etiqueta</th>
            <th>Estado</th>
            {onSelect && <th aria-label="acciones" />}
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr
              key={node.id}
              className={selectedId === node.id ? 'is-selected' : ''}
            >
              <td className="mono">{node.id}</td>
              <td>{node.type}</td>
              <td>{node.label}</td>
              <td>
                <Badge status={node.status} />
              </td>
              {onSelect && (
                <td>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => onSelect(node)}
                  >
                    Vecinos
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EdgesTable({ edges = [] }) {
  if (!edges.length) {
    return (
      <EmptyState title="Sin relaciones" message="No hay relaciones para mostrar." />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Origen</th>
            <th>Relación</th>
            <th>Destino</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge) => (
            <tr key={edge.id}>
              <td className="mono">{edge.source}</td>
              <td>{edge.relation}</td>
              <td className="mono">{edge.target}</td>
              <td>
                <Badge status={edge.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Export por defecto: ambas tablas juntas (nodos + relaciones).
export default function TraceGraphTable({ nodes, edges, selectedId, onSelect }) {
  return (
    <div className="stack">
      <div className="stack">
        <h3 className="text-sm">Nodos ({nodes?.length || 0})</h3>
        <NodesTable nodes={nodes} selectedId={selectedId} onSelect={onSelect} />
      </div>
      <div className="stack">
        <h3 className="text-sm">Relaciones ({edges?.length || 0})</h3>
        <EdgesTable edges={edges} />
      </div>
    </div>
  );
}
