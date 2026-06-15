// Encabezado de seccion/pagina con titulo, subtitulo y acciones opcionales.

export default function SectionHeader({ title, subtitle, actions }) {
  return (
    <header className="section-header">
      <div className="section-header__titles">
        <h1 className="section-header__title">{title}</h1>
        {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="section-header__actions">{actions}</div>}
    </header>
  );
}
