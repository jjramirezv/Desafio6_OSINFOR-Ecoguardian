<?php

namespace App\Modules\Consistency\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Motor backend de consistencia, discrepancias y alertas por lote (S5-BE-02).
 *
 * Evalua reglas tecnicas/documentales sobre un lote de importacion y persiste
 * el resultado en `consistency_alerts`. El motor NO declara legalidad ni
 * ilegalidad: solo detecta inconsistencias para que un revisor humano las
 * analice (calidad de datos, trazabilidad, volumen, documentos y grafo).
 *
 * Es idempotente: ejecutar el motor varias veces sobre el mismo lote no
 * duplica alertas. La identidad logica de una alerta es la tupla
 * (import_batch_id, entity_type, entity_id, alert_code). Al reevaluar se
 * actualizan los campos mutables (titulo, descripcion, severidad, evidencia)
 * pero se preserva el `status` que un revisor pudo haber cambiado.
 *
 * Usa DB::table en lugar de Eloquent para mantenerse alineado con el resto del
 * conector interoperable, el grafo y la huella legal.
 */
class ConsistencyService
{
    /**
     * Tablas operativas del lote, usadas para detectar registros operativos.
     *
     * @var list<string>
     */
    private const OPERATIONAL_TABLES = [
        'operation_tala',
        'operation_trozado',
        'operation_despacho',
        'extraction_balances',
        'gtfs',
    ];

    /**
     * Ejecuta todas las reglas de consistencia sobre un lote.
     *
     * @return array{import_batch_id:int,alerts_created_or_found:int,critical:int,errors:int,warnings:int,info:int}
     *
     * @throws InvalidArgumentException si el lote no existe.
     */
    public function runForImportBatch(int $importBatchId): array
    {
        $batch = DB::table('import_batches')->where('id', $importBatchId)->first();

        if ($batch === null) {
            throw new InvalidArgumentException("Import batch {$importBatchId} not found.");
        }

        // Cada regla devuelve cero o mas alertas (definiciones, sin persistir).
        $alerts = array_merge(
            $this->ruleImportErrorsPresent($importBatchId),
            $this->ruleNoSourceRecords($importBatchId),
            $this->ruleSourceRecordsNotPersisted($importBatchId),
            $this->ruleOperationalWithoutGraph($importBatchId),
            $this->ruleVolumeExceedsAuthorized($importBatchId),
            $this->ruleGtfWithoutBalance($importBatchId),
            $this->ruleDispatchWithoutGtf($importBatchId),
        );

        $summary = [
            'import_batch_id' => $importBatchId,
            'alerts_created_or_found' => 0,
            'critical' => 0,
            'errors' => 0,
            'warnings' => 0,
            'info' => 0,
        ];

        foreach ($alerts as $alert) {
            $this->upsertAlert($importBatchId, $alert);

            $summary['alerts_created_or_found']++;

            match (strtoupper($alert['severity'])) {
                'CRITICAL' => $summary['critical']++,
                'ERROR' => $summary['errors']++,
                'WARNING' => $summary['warnings']++,
                'INFO' => $summary['info']++,
                default => null,
            };
        }

        return $summary;
    }

    /**
     * Persiste una alerta de forma idempotente segun su identidad logica.
     *
     * Si ya existe una alerta con la misma tupla (import_batch_id, entity_type,
     * entity_id, alert_code) actualiza los campos mutables pero conserva su
     * `status` actual (que un revisor pudo cambiar). Si no existe la crea con
     * status OPEN.
     *
     * @param  array<string,mixed>  $alert
     */
    private function upsertAlert(int $importBatchId, array $alert): void
    {
        $now = now();

        $entityType = $alert['entity_type'] ?? null;
        $entityId = $alert['entity_id'] ?? null;

        // Builder con manejo correcto de NULL (Laravel convierte where(col, null)
        // a whereNull), de modo que las alertas a nivel lote tambien casan.
        $existing = DB::table('consistency_alerts')
            ->where('import_batch_id', $importBatchId)
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('alert_code', $alert['alert_code'])
            ->first();

        $mutable = [
            'source_record_id' => $alert['source_record_id'] ?? null,
            'alert_type' => $alert['alert_type'],
            'severity' => $alert['severity'],
            'title' => $alert['title'],
            'description' => $alert['description'] ?? null,
            'evidence' => isset($alert['evidence']) ? json_encode($alert['evidence']) : null,
            'metadata' => isset($alert['metadata']) ? json_encode($alert['metadata']) : null,
            'updated_at' => $now,
        ];

        if ($existing !== null) {
            DB::table('consistency_alerts')
                ->where('id', $existing->id)
                ->update($mutable);

            return;
        }

        DB::table('consistency_alerts')->insert($mutable + [
            'import_batch_id' => $importBatchId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'alert_code' => $alert['alert_code'],
            'status' => 'OPEN',
            'created_at' => $now,
        ]);
    }

    /**
     * Regla 1: IMPORT_ERRORS_PRESENT.
     *
     * @return array<int,array<string,mixed>>
     */
    private function ruleImportErrorsPresent(int $importBatchId): array
    {
        $count = DB::table('import_errors')->where('import_batch_id', $importBatchId)->count();

        if ($count === 0) {
            return [];
        }

        return [[
            'alert_code' => 'IMPORT_ERRORS_PRESENT',
            'alert_type' => 'DATA_QUALITY',
            'severity' => 'ERROR',
            'title' => 'Errores de importación detectados',
            'description' => 'El lote contiene errores de normalización o validación.',
            'evidence' => ['import_errors' => $count],
        ]];
    }

    /**
     * Regla 2: NO_SOURCE_RECORDS.
     *
     * @return array<int,array<string,mixed>>
     */
    private function ruleNoSourceRecords(int $importBatchId): array
    {
        if ($this->countSourceRecords($importBatchId) > 0) {
            return [];
        }

        return [[
            'alert_code' => 'NO_SOURCE_RECORDS',
            'alert_type' => 'TRACEABILITY',
            'severity' => 'CRITICAL',
            'title' => 'Lote sin registros fuente',
            'description' => 'No existen registros fuente normalizados para este lote.',
        ]];
    }

    /**
     * Regla 3: SOURCE_RECORDS_NOT_PERSISTED.
     *
     * Existen source_records en estado NORMALIZED que aun no pasaron a
     * PERSISTED/SKIPPED.
     *
     * @return array<int,array<string,mixed>>
     */
    private function ruleSourceRecordsNotPersisted(int $importBatchId): array
    {
        $pending = DB::table('source_records')
            ->whereRaw("metadata->>'import_batch_id' = ?", [(string) $importBatchId])
            ->where('status', 'NORMALIZED')
            ->count();

        if ($pending === 0) {
            return [];
        }

        return [[
            'alert_code' => 'SOURCE_RECORDS_NOT_PERSISTED',
            'alert_type' => 'TRACEABILITY',
            'severity' => 'WARNING',
            'title' => 'Registros normalizados no persistidos',
            'description' => 'Existen registros fuente que aún no fueron persistidos en tablas operativas.',
            'evidence' => ['normalized_pending' => $pending],
        ]];
    }

    /**
     * Regla 4: OPERATIONAL_WITHOUT_GRAPH.
     *
     * Hay registros operativos persistidos pero no se encontro proyeccion
     * operativa en el grafo (trace_nodes con projection_type OPERATIONAL_RECORD
     * del lote).
     *
     * @return array<int,array<string,mixed>>
     */
    private function ruleOperationalWithoutGraph(int $importBatchId): array
    {
        if ($this->countOperationalRecords($importBatchId) === 0) {
            return [];
        }

        $graphNodes = DB::table('trace_nodes')
            ->whereRaw("metadata->>'projection_type' = ?", ['OPERATIONAL_RECORD'])
            ->whereRaw("metadata->>'import_batch_id' = ?", [(string) $importBatchId])
            ->count();

        if ($graphNodes > 0) {
            return [];
        }

        return [[
            'alert_code' => 'OPERATIONAL_WITHOUT_GRAPH',
            'alert_type' => 'GRAPH',
            'severity' => 'WARNING',
            'title' => 'Registros operativos sin proyección al grafo',
            'description' => 'Hay registros operativos persistidos, pero no se encontró grafo operativo proyectado.',
        ]];
    }

    /**
     * Regla 5: VOLUME_EXCEEDS_AUTHORIZED.
     *
     * Un balance presenta volumen extraido mayor al autorizado. Una alerta por
     * balance afectado.
     *
     * @return array<int,array<string,mixed>>
     */
    private function ruleVolumeExceedsAuthorized(int $importBatchId): array
    {
        $balances = DB::table('extraction_balances')
            ->where('import_batch_id', $importBatchId)
            ->whereNotNull('authorized_volume_m3')
            ->whereNotNull('extracted_volume_m3')
            ->whereColumn('extracted_volume_m3', '>', 'authorized_volume_m3')
            ->orderBy('id')
            ->get();

        $alerts = [];

        foreach ($balances as $balance) {
            $alerts[] = [
                'alert_code' => 'VOLUME_EXCEEDS_AUTHORIZED',
                'alert_type' => 'VOLUME',
                'severity' => 'CRITICAL',
                'title' => 'Volumen extraído excede volumen autorizado',
                'description' => 'Un balance presenta volumen extraído mayor al autorizado.',
                'entity_type' => 'extraction_balances',
                'entity_id' => (int) $balance->id,
                'source_record_id' => $balance->source_record_id === null ? null : (int) $balance->source_record_id,
                'evidence' => [
                    'balance_code' => $balance->balance_code,
                    'species' => $balance->species,
                    'authorized_volume_m3' => $balance->authorized_volume_m3,
                    'extracted_volume_m3' => $balance->extracted_volume_m3,
                ],
            ];
        }

        return $alerts;
    }

    /**
     * Regla 6: GTF_WITHOUT_BALANCE.
     *
     * Una GTF del lote no tiene vinculo con un balance de extraccion. Una alerta
     * por GTF afectada.
     *
     * @return array<int,array<string,mixed>>
     */
    private function ruleGtfWithoutBalance(int $importBatchId): array
    {
        $gtfs = DB::table('gtfs')
            ->where('import_batch_id', $importBatchId)
            ->whereNull('extraction_balance_id')
            ->orderBy('id')
            ->get();

        $alerts = [];

        foreach ($gtfs as $gtf) {
            $alerts[] = [
                'alert_code' => 'GTF_WITHOUT_BALANCE',
                'alert_type' => 'DOCUMENT',
                'severity' => 'WARNING',
                'title' => 'GTF sin balance asociado',
                'description' => 'La GTF no tiene vínculo con un balance de extracción.',
                'entity_type' => 'gtfs',
                'entity_id' => (int) $gtf->id,
                'source_record_id' => $gtf->source_record_id === null ? null : (int) $gtf->source_record_id,
                'evidence' => [
                    'gtf_number' => $gtf->gtf_number,
                    'species' => $gtf->species,
                ],
            ];
        }

        return $alerts;
    }

    /**
     * Regla 7: DISPATCH_WITHOUT_GTF.
     *
     * Existe despacho operativo del lote pero ninguna GTF registrada en el lote.
     *
     * @return array<int,array<string,mixed>>
     */
    private function ruleDispatchWithoutGtf(int $importBatchId): array
    {
        $despachos = DB::table('operation_despacho')->where('import_batch_id', $importBatchId)->count();

        if ($despachos === 0) {
            return [];
        }

        $gtfs = DB::table('gtfs')->where('import_batch_id', $importBatchId)->count();

        if ($gtfs > 0) {
            return [];
        }

        return [[
            'alert_code' => 'DISPATCH_WITHOUT_GTF',
            'alert_type' => 'DOCUMENT',
            'severity' => 'WARNING',
            'title' => 'Despacho sin GTF registrada',
            'description' => 'Existe despacho operativo sin GTF registrada en el lote.',
            'evidence' => ['operation_despacho' => $despachos],
        ]];
    }

    /**
     * Cuenta los source_records del lote (resueltos por metadata->import_batch_id).
     */
    private function countSourceRecords(int $importBatchId): int
    {
        return DB::table('source_records')
            ->whereRaw("metadata->>'import_batch_id' = ?", [(string) $importBatchId])
            ->count();
    }

    /**
     * Cuenta el total de registros operativos del lote en todas las tablas.
     */
    private function countOperationalRecords(int $importBatchId): int
    {
        $total = 0;

        foreach (self::OPERATIONAL_TABLES as $table) {
            $total += DB::table($table)->where('import_batch_id', $importBatchId)->count();
        }

        return $total;
    }
}
