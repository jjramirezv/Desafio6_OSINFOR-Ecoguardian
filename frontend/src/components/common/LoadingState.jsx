// Indicador de carga reutilizable.

export default function LoadingState({ label = 'Cargando…' }) {
  return (
    <div className="state">
      <div className="spinner" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
