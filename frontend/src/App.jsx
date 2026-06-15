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
<<<<<<< HEAD
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
=======
    title: 'Panel general',
    subtitle: 'Estado operativo, alcance funcional y advertencias de uso.',
  },
  import: {
    title: 'Conector interoperable',
    subtitle: 'Flujo controlado de lote, normalizacion, persistencia y proyeccion.',
  },
  traceability: {
    title: 'Trazabilidad',
    subtitle: 'Grafo de evidencia, relaciones y eventos por lote.',
  },
  footprint: {
    title: 'Huella legal',
    subtitle: 'Ficha tecnica de trazabilidad, score y observaciones.',
  },
  consistency: {
    title: 'Alertas',
    subtitle: 'Motor de consistencia, filtros y revision de alertas.',
  },
  verification: {
    title: 'Verificacion',
    subtitle: 'Snapshot, hash y consulta publica por codigo.',
>>>>>>> 8c6134fcb4938622eca65798a6025564a20a86e5
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
      backendReady={backend.summary?.backend_status === 'READY_FOR_DEMO'}
    >
      {page}
    </AppLayout>
  );
}
