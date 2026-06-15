// Visor de JSON identado para inspeccionar respuestas del backend.

import { prettyJson } from '../../utils/formatters.js';

export default function JsonViewer({ value, className = '' }) {
  if (value === null || value === undefined) return null;
  return (
    <pre className={`json-viewer ${className}`.trim()}>{prettyJson(value)}</pre>
  );
}
