import { useEffect } from 'react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import JsonViewer from '../components/common/JsonViewer.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import AlertList from '../components/domain/AlertList.jsx';
import {
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  useConsistencyAlerts,
} from '../hooks/useConsistencyAlerts.js';

const ALERT_TYPES = ['DATA_QUALITY', 'TRACEABILITY', 'GRAPH', 'VOLUME', 'DOCUMENT'];

function SelectField({ label, value, onChange, options, allLabel = 'Todos' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ConsistencyAlertsPage({
  initialBatchId = '',
  onBatchChange,
}) {
  const alertsState = useConsistencyAlerts(initialBatchId);
  const {
    batchId,
    setBatchId,
    filters,
    updateFilter,
    clearFilters,
    alerts,
    selectedAlert,
    runSummary,
    loading,
    error,
    lastMessage,
    loadAlerts,
    runConsistency,
    loadAlert,
    updateAlertStatus,
  } = alertsState;

  useEffect(() => {
    if (batchId) onBatchChange?.(batchId);
  }, [batchId, onBatchChange]);

  const canQuery = String(batchId || '').trim() !== '';

  return (
    <>
      <SectionHeader
        title="Consistencia y alertas"
        subtitle="Ejecucion de motor, filtros, detalle y cambio de estado Sprint 5."
        actions={
          <Button
            onClick={() => runConsistency()}
            disabled={!canQuery || Boolean(loading)}
          >
            {loading === 'consistency' ? 'Ejecutando...' : 'Ejecutar consistencia'}
          </Button>
        }
      />

      {error && (
        <EmptyState
          variant="error"
          title="Error en consistencia"
          message={error.message}
        />
      )}

      {lastMessage && <p className="disclaimer">{lastMessage}</p>}

      <Card title="Lote y filtros">
        <div className="query-bar">
          <label className="field">
            <span>import_batch_id</span>
            <input
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              placeholder="Ej. 1"
              inputMode="numeric"
            />
          </label>
          <SelectField
            label="severity"
            value={filters.severity}
            onChange={(value) => updateFilter('severity', value)}
            options={ALERT_SEVERITIES}
          />
          <SelectField
            label="status"
            value={filters.status}
            onChange={(value) => updateFilter('status', value)}
            options={ALERT_STATUSES}
          />
          <SelectField
            label="alert_type"
            value={filters.alert_type}
            onChange={(value) => updateFilter('alert_type', value)}
            options={ALERT_TYPES}
          />
          <Button onClick={() => loadAlerts()} disabled={!canQuery || Boolean(loading)}>
            {loading === 'alerts' ? 'Listando...' : 'Listar alertas'}
          </Button>
          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={Boolean(loading)}
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {loading && <LoadingState label="Esperando respuesta del backend..." />}

      <div className="grid-2">
        <Card title="Resumen de ejecucion">
          {runSummary ? (
            <JsonViewer value={runSummary} />
          ) : (
            <EmptyState
              title="Sin ejecucion"
              message="Ejecuta el motor de consistencia para ver el resumen."
            />
          )}
        </Card>

        <Card title="Detalle de alerta">
          {selectedAlert ? (
            <JsonViewer value={selectedAlert} />
          ) : (
            <EmptyState
              title="Sin alerta seleccionada"
              message="Usa Detalle en una fila para consultar GET /consistency-alerts/{id}."
            />
          )}
        </Card>

        <Card title={`Alertas (${alerts.length})`} className="col-span-2">
          <AlertList
            alerts={alerts}
            selectedId={selectedAlert?.id}
            onSelect={loadAlert}
            onChangeStatus={updateAlertStatus}
            changingStatus={loading === 'alert-status'}
            statuses={ALERT_STATUSES}
          />
        </Card>
      </div>
    </>
  );
}
