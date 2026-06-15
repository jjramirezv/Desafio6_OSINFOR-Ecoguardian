import Badge from '../common/Badge.jsx';
import { API_BASE_URL } from '../../api/httpClient.js';

export default function Header({ title, subtitle, backendStatus }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo">
          <img src="/images/logo-osinfor.png" alt="OSINFOR" className="app-header__logo-img" />
          <span className="app-header__logo-text">
            <span className="app-header__logo-name">OSINFOR</span>
            <span className="app-header__logo-sub">Supervisión Forestal</span>
          </span>
        </div>
        <span className="app-header__divider" />
        <span className="app-header__page-title">{title}</span>
      </div>
      <div className="app-header__meta">
        <span className="app-header__api">{API_BASE_URL}</span>
        {backendStatus && (
          <Badge status={backendStatus} size="lg">
            {backendStatus}
          </Badge>
        )}
      </div>
    </header>
  );
}
