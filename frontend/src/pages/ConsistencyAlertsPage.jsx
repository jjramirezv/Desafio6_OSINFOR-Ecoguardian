import { useEffect } from 'react';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CollapsibleJson from '../components/common/CollapsibleJson.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import MetricCard from '../components/common/MetricCard.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
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

      {loading && <LoadingState label="Esperando respuesta del backend..." />}

      <div className="grid-2">
        <Card title="Resumen de ejecucion">
          {runSummary ? (
            <div className="stack">
              <div className="grid-3">
                <MetricCard
                  title="Alertas generadas"
                  value={toCount(runSummary.alerts_created ?? runSummary.total_alerts)}
                  detail="Segun respuesta del motor"
                />
                <MetricCard
                  title="Reglas evaluadas"
                  value={toCount(runSummary.rules_evaluated)}
                  detail="Validaciones procesadas"
                />
                <MetricCard
                  title="Estado"
                  value={runSummary.status || 'Completado'}
                  detail="Resultado de ejecucion"
                />
              </div>
              <CollapsibleJson title="Ver respuesta tecnica" data={runSummary} />
            </div>
          ) : (
            <EmptyState
              title="Sin ejecucion"
              message="Ejecuta el motor de consistencia para ver el resumen."
            />
          )}
        </Card>

        <Card
          title="Detalle de alerta"
          actions={selectedAlert?.status ? <Badge status={selectedAlert.status} /> : null}
        >
          {selectedAlert ? (
            <div className="stack">
              <div className="kv">
                <div className="kv__item">
                  <span className="kv__key">Codigo</span>
                  <span className="kv__value mono">{selectedAlert.alert_code}</span>
                </div>
                <div className="kv__item">
                  <span className="kv__key">Tipo</span>
                  <span className="kv__value">{selectedAlert.alert_type}</span>
                </div>
                <div className="kv__item">
                  <span className="kv__key">Severidad</span>
                  <span className="kv__value">{selectedAlert.severity}</span>
                </div>
                <div className="kv__item">
                  <span className="kv__key">Estado</span>
                  <span className="kv__value">
                    <Badge status={selectedAlert.status} />
                  </span>
                </div>
                <div className="kv__item kv__item--full">
                  <span className="kv__key">Titulo</span>
                  <span className="kv__value">{selectedAlert.title}</span>
                </div>
              </div>
              <CollapsibleJson title="Detalle tecnico JSON" data={selectedAlert} />
            </div>
          ) : (
            <EmptyState
              title="Sin alerta seleccionada"
              message="Usa Detalle en una alerta para consultar su ficha."
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
