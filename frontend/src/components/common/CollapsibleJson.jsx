import { useState } from 'react';
import JsonViewer from './JsonViewer.jsx';

export default function CollapsibleJson({
  title = 'Ver respuesta tecnica',
  data,
  className = '',
}) {
  const [open, setOpen] = useState(false);

  if (data === null || data === undefined) return null;

  return (
    <div className={`technical-detail ${className}`.trim()}>
      <button
        type="button"
        className="technical-detail__trigger"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? 'Ocultar' : 'Mostrar'}</span>
      </button>
      {open && (
        <div className="technical-detail__body">
          <JsonViewer value={data} />
        </div>
      )}
    </div>
  );
}
