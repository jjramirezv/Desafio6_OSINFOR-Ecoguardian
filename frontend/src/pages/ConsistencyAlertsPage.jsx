import { useEffect } from 'react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import SummaryCard from '../components/common/SummaryCard.jsx';
import AlertList from '../components/domain/AlertList.jsx';
import {
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  useConsistencyAlerts,
} from '../hooks/useConsistencyAlerts.js';
import { toCount } from '../utils/formatters.js';

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
        title="Alertas"
        subtitle="Modulo de revision de consistencia documental y trazabilidad."
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
            <span>ID de lote</span>
            <input
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              placeholder="Ej. 1"
              inputMode="numeric"
            />
          </label>
          <SelectField
            label="Severidad"
            value={filters.severity}
            onChange={(value) => updateFilter('severity', value)}
            options={ALERT_SEVERITIES}
          />
          <SelectField
            label="Estado"
            value={filters.status}
            onChange={(value) => updateFilter('status', value)}
            options={ALERT_STATUSES}
          />
          <SelectField
            label="Tipo"
            value={filters.alert_type}
            onChange={(value) => updateFilter('alert_type', value)}
            options={ALERT_TYPES}
          />
          <Button onClick={() => loadAlerts()} disabled={!canQuery || Boolean(loading)}>
            {loading === 'alerts' ? 'Listando...' : 'Listar alertas'}
          </Button>
          <Button variant="ghost" onClick={clearFilters} disabled={Boolean(loading)}>
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {loading && <ProgressBar label="Esperando respuesta del backend..." />}

      <div className="grid-2">
        <SummaryCard
          title="Resumen de ejecucion"
          subtitle="Alertas generadas, reglas evaluadas y estado del motor"
          metrics={runSummary ? [
            { label: 'Alertas generadas', value: toCount(runSummary.alerts_created ?? runSummary.total_alerts) },
            { label: 'Reglas evaluadas', value: toCount(runSummary.rules_evaluated) },
            { label: 'Estado', value: runSummary.status || 'Completado', color: 'var(--c-forest-600)' },
          ] : []}
          footer={
            runSummary ? (
              <CollapsibleJson title="Ver respuesta tecnica" data={runSummary} />
            ) : (
              <EmptyState
                title="Sin ejecucion"
                message="Ejecuta el motor de consistencia para ver el resumen."
              />
            )
          }
        />

        <SummaryCard
          title="Detalle de alerta"
          subtitle={selectedAlert ? `Ficha de la alerta seleccionada` : 'Selecciona una alerta de la lista'}
          accent
          items={selectedAlert ? [
            { label: 'Codigo', value: selectedAlert.alert_code, mono: true },
            { label: 'Tipo', value: selectedAlert.alert_type },
            { label: 'Severidad', value: selectedAlert.severity, badge: true, color: selectedAlert.severity === 'HIGH' ? 'var(--c-danger-500)' : selectedAlert.severity === 'MEDIUM' ? 'var(--c-osinfor-ambar)' : 'var(--c-osinfor-marron)' },
            { label: 'Estado', value: selectedAlert.status, badge: true },
            { label: 'Titulo', value: selectedAlert.title },
          ] : []}
          footer={
            selectedAlert ? (
              <CollapsibleJson title="Detalle tecnico JSON" data={selectedAlert} />
            ) : (
              <EmptyState
                title="Sin alerta seleccionada"
                message="Usa Detalle en una alerta para consultar su ficha."
              />
            )
          }
        />

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
