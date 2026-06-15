import { useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ImportWorkflowPage from './pages/ImportWorkflowPage.jsx';
import ConsistencyAlertsPage from './pages/ConsistencyAlertsPage.jsx';
import LegalFootprintPage from './pages/LegalFootprintPage.jsx';
import PublicVerificationPage from './pages/PublicVerificationPage.jsx';
import TraceabilityPage from './pages/TraceabilityPage.jsx';
import { useBackendStatus } from './hooks/useBackendStatus.js';

const PAGE_META = {
  dashboard: {
    title: 'Panel general',
    subtitle: 'Estado del backend y alcance funcional Sprint 1-3.',
  },
  import: {
    title: 'Conector interoperable',
    subtitle: 'Creacion, normalizacion, persistencia y proyeccion de lote demo.',
  },
  traceability: {
    title: 'Trazabilidad por lote',
    subtitle: 'Grafo, timeline, busqueda de nodos y vecindarios.',
  },
  footprint: {
    title: 'Huella tecnica',
    subtitle: 'Resumen y huella completa por lote.',
  },
  consistency: {
    title: 'Consistencia y alertas',
    subtitle: 'Motor de consistencia, filtros y revision de alertas.',
  },
  verification: {
    title: 'Verificacion publica',
    subtitle: 'Snapshot, hash y consulta por codigo verificable.',
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

    if (currentPage === 'footprint') {
      return (
        <LegalFootprintPage
          initialBatchId={activeBatchId}
          onBatchChange={setActiveBatchId}
        />
      );
    }

    if (currentPage === 'consistency') {
      return (
        <ConsistencyAlertsPage
          initialBatchId={activeBatchId}
          onBatchChange={setActiveBatchId}
        />
      );
    }

    if (currentPage === 'verification') {
      return <PublicVerificationPage initialBatchId={activeBatchId} />;
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
