import { useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ImportWorkflowPage from './pages/ImportWorkflowPage.jsx';
import TraceabilityPage from './pages/TraceabilityPage.jsx';
import { useBackendStatus } from './hooks/useBackendStatus.js';

const PAGE_META = {
  dashboard: {
    title: 'Panel General',
    subtitle: 'Estado del backend, sistemas fuente y grafo de evidencia.',
  },
  import: {
    title: 'Conector interoperable',
    subtitle: 'Creación, normalización, persistencia y proyección de lote demo.',
  },
  traceability: {
    title: 'Trazabilidad por lote',
    subtitle: 'Grafo, timeline, búsqueda de nodos y vecindarios.',
  },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeBatchId, setActiveBatchId] = useState('');
  const backend = useBackendStatus();

  const pageMeta = PAGE_META[currentPage] || PAGE_META.dashboard;

  const page = useMemo(() => {
    if (currentPage === 'import') {
      return <ImportWorkflowPage onBatchChange={setActiveBatchId} />;
    }

    if (currentPage === 'traceability') {
      return <TraceabilityPage initialBatchId={activeBatchId} />;
    }

    return <DashboardPage backend={backend} />;
  }, [activeBatchId, backend, currentPage]);

  return (
    <AppLayout
      current={currentPage}
      onNavigate={setCurrentPage}
      title={pageMeta.title}
      subtitle={pageMeta.subtitle}
      backendStatus={backend.summary?.backend_status}
    >
      {page}
    </AppLayout>
  );
}
