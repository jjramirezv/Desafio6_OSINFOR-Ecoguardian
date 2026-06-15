// Cabecera superior: titulo de la pagina activa, base de API y estado backend.

import Badge from '../common/Badge.jsx';
import { API_BASE_URL } from '../../api/httpClient.js';

export default function Header({ title, subtitle, backendStatus, backendReady }) {
  return (
    <header className="app-header">
      <div className="app-header__titles">
        <span className="app-header__system">Huella Legal Forestal</span>
        <h1 className="app-header__title">{title}</h1>
        {subtitle && <p className="app-header__subtitle">{subtitle}</p>}
      </div>
      <div className="app-header__meta">
        <span className="app-header__api">API base: {API_BASE_URL}</span>
        {backendStatus && (
          <Badge status={backendStatus} size="lg">
            Backend {backendStatus}
          </Badge>
        )}
        {backendReady && <Badge variant="success" size="lg">READY_FOR_DEMO</Badge>}
      </div>
    </header>
  );
}
