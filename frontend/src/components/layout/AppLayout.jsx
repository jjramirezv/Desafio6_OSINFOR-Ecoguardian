// Shell de la aplicacion: compone Sidebar + Header + area principal.
// No contiene logica de dominio; solo estructura y navegacion.

import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export default function AppLayout({
  current,
  onNavigate,
  title,
  subtitle,
  backendStatus,
  backendReady,
  children,
}) {
  return (
    <div className="app">
      <Sidebar current={current} onNavigate={onNavigate} />
      <Header
        title={title}
        subtitle={subtitle}
        backendStatus={backendStatus}
        backendReady={backendReady}
      />
      <main className="app-main">
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
