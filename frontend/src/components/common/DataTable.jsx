import EmptyState from './EmptyState.jsx';

export default function DataTable({
  columns = [],
  rows = [],
  getRowKey,
  emptyTitle = 'Sin datos',
  emptyMessage = 'No hay registros para mostrar.',
  onRowClick,
  selectedId,
}) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowKey = getRowKey ? getRowKey(row, index) : row.id ?? index;
            const selected = selectedId !== undefined && selectedId === row.id;
            return (
              <tr
                key={rowKey}
                className={selected ? 'is-selected' : ''}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row) : row[column.key] ?? '-'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
