<?php

namespace App\Modules\LegalFootprint\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Construye la "Huella Legal" backend de un lote de importacion (S4-BE-01).
 *
 * La Huella Legal es un subgrafo verificable que resume la evidencia tecnica de
 * un lote: registros fuente, errores de importacion, registros operativos
 * persistidos, el subgrafo de trazabilidad (nodos/relaciones) y los eventos del
 * grafo. NO certifica legalidad ni declara ilegalidad: solo describe el estado
 * tecnico de la cadena para su revision.
 *
 * Estados tecnicos posibles:
 * - OBSERVED:   el lote tiene errores de importacion que deben revisarse.
 * - INCOMPLETE: falta evidencia (sin source_records o sin nodos de grafo).
 * - TRACEABLE:  hay evidencia (source_records, registros operativos o grafo) y
 *               sin errores.
 *
 * Usa DB::table en lugar de Eloquent para mantenerse alineado con el resto del
 * conector interoperable y del modulo de grafo.
 */
class LegalFootprintService
{
    /**
     * Tablas operativas que componen los registros operativos del lote.
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
     * Construye la huella legal completa de un lote de importacion.
     *
     * @return array<string,mixed>
     *
     * @throws InvalidArgumentException si el lote no existe.
     */
    public function buildFromImportBatch(int $importBatchId): array
    {
        $batch = DB::table('import_batches')->where('id', $importBatchId)->first();

        if ($batch === null) {
            throw new InvalidArgumentException("Import batch {$importBatchId} not found.");
        }

        $sourceRecords = $this->loadSourceRecords($importBatchId);
        $errors = $this->loadErrors($importBatchId);
        $operationalRecords = $this->loadOperationalRecords($importBatchId);
        $graph = $this->loadGraph($batch);
        $events = $this->loadEvents($importBatchId);
        $alerts = $this->loadAlerts($importBatchId);

        $footprint = [
            'import_batch' => [
                'id' => (int) $batch->id,
                'batch_code' => $batch->batch_code,
                'name' => $batch->name,
                'import_type' => $batch->import_type,
                'status' => $batch->status,
                'counters' => [
                    'total_rows' => (int) $batch->total_rows,
                    'processed_rows' => (int) $batch->processed_rows,
                    'successful_rows' => (int) $batch->successful_rows,
                    'failed_rows' => (int) $batch->failed_rows,
                ],
                'created_at' => $batch->created_at,
            ],
            'source_records' => $sourceRecords,
            'errors' => $errors,
            'operational_records' => $operationalRecords,
            'graph' => $graph,
            'events' => $events,
            'alerts' => $alerts,
        ];

        $footprint['status'] = $this->computeStatus($footprint);
        $footprint['completeness'] = $this->computeCompleteness($footprint);

        return $footprint;
    }

    /**
     * Determina el estado tecnico de la huella a partir de su evidencia.
     *
     * Prioridad: OBSERVED (hay errores de importacion o alertas de consistencia
     * CRITICAL/ERROR abiertas) > INCOMPLETE (sin source_records o sin nodos de
     * grafo) > TRACEABLE. Nunca usa LEGAL/ILLEGAL.
     *
     * @param  array<string,mixed>  $footprint
     */
    public function computeStatus(array $footprint): string
    {
        $hasErrors = ! empty($footprint['errors']);
        $hasSourceRecords = ! empty($footprint['source_records']);
        $hasGraphNodes = ! empty($footprint['graph']['nodes'] ?? []);
        $hasOperationalRecords = $this->hasOperationalRecords($footprint['operational_records'] ?? []);

        // Alertas de consistencia CRITICAL o ERROR abiertas tambien observan la
        // huella (S5-BE-04). Son observaciones tecnicas, no sentencia legal.
        $alerts = $footprint['alerts'] ?? [];
        $hasBlockingOpenAlerts = ($alerts['open_critical'] ?? 0) > 0 || ($alerts['open_errors'] ?? 0) > 0;

        if ($hasErrors || $hasBlockingOpenAlerts) {
            return 'OBSERVED';
        }

        if (! $hasSourceRecords || ! $hasGraphNodes) {
            return 'INCOMPLETE';
        }

        if ($hasSourceRecords || $hasOperationalRecords || $hasGraphNodes) {
            return 'TRACEABLE';
        }

        return 'INCOMPLETE';
    }

    /**
     * Resume la completitud de la huella y calcula un score tecnico (0-100).
     *
     * El score es un indicador de cuanta evidencia tecnica acompana al lote, no
     * un juicio de legalidad.
     *
     * @param  array<string,mixed>  $footprint
     * @return array{has_source_records:bool,has_operational_records:bool,has_graph:bool,has_errors:bool,score:int}
     */
    public function computeCompleteness(array $footprint): array
    {
        $hasSourceRecords = ! empty($footprint['source_records']);
        $hasOperationalRecords = $this->hasOperationalRecords($footprint['operational_records'] ?? []);
        $hasGraph = ! empty($footprint['graph']['nodes'] ?? []);
        $hasErrors = ! empty($footprint['errors']);

        $score = 0;
        $score += $hasSourceRecords ? 40 : 0;
        $score += $hasOperationalRecords ? 20 : 0;
        $score += $hasGraph ? 20 : 0;
        $score -= $hasErrors ? 20 : 0;

        $score = max(0, min(100, $score));

        return [
            'has_source_records' => $hasSourceRecords,
            'has_operational_records' => $hasOperationalRecords,
            'has_graph' => $hasGraph,
            'has_errors' => $hasErrors,
            'score' => $score,
        ];
    }

    /**
     * Indica si existe al menos un registro operativo en cualquier tabla.
     *
     * @param  array<string,mixed>  $operationalRecords
     */
    private function hasOperationalRecords(array $operationalRecords): bool
    {
        foreach ($operationalRecords as $rows) {
            if (! empty($rows)) {
                return true;
            }
        }

        return false;
    }

    /**
     * source_records del lote (resueltos por metadata->import_batch_id).
     *
     * @return array<int,array<string,mixed>>
     */
    private function loadSourceRecords(int $importBatchId): array
    {
        return DB::table('source_records')
            ->whereRaw("metadata->>'import_batch_id' = ?", [(string) $importBatchId])
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'record_type' => $row->record_type,
                'status' => $row->status,
                'external_id' => $row->external_id,
                'normalized_payload' => $this->decodeJson($row->normalized_payload),
                'metadata' => $this->decodeJson($row->metadata),
            ])
            ->all();
    }

    /**
     * import_errors del lote.
     *
     * @return array<int,array<string,mixed>>
     */
    private function loadErrors(int $importBatchId): array
    {
        return DB::table('import_errors')
            ->where('import_batch_id', $importBatchId)
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'row_number' => $row->row_number === null ? null : (int) $row->row_number,
                'field_name' => $row->field_name,
                'error_code' => $row->error_code,
                'error_message' => $row->error_message,
                'severity' => $row->severity,
            ])
            ->all();
    }

    /**
     * Registros operativos del lote agrupados por tabla.
     *
     * @return array<string,array<int,object>>
     */
    private function loadOperationalRecords(int $importBatchId): array
    {
        $records = [];

        foreach (self::OPERATIONAL_TABLES as $table) {
            $records[$table] = DB::table($table)
                ->where('import_batch_id', $importBatchId)
                ->orderBy('id')
                ->get()
                ->all();
        }

        return $records;
    }

    /**
     * Subgrafo de trazabilidad del lote: nodo del lote, relaciones salientes y
     * nodos destino. Si el lote no fue proyectado devuelve nodes/edges vacios.
     *
     * @return array{nodes:array<int,array<string,mixed>>,edges:array<int,array<string,mixed>>}
     */
    private function loadGraph(object $batch): array
    {
        $batchNode = DB::table('trace_nodes')
            ->whereRaw("metadata->>'projection_type' = ?", ['IMPORT_BATCH'])
            ->whereRaw("metadata->>'batch_code' = ?", [(string) $batch->batch_code])
            ->orderBy('id')
            ->first();

        if ($batchNode === null) {
            return ['nodes' => [], 'edges' => []];
        }

        $edges = DB::table('trace_edges')
            ->where('source_node_id', $batchNode->id)
            ->orderBy('id')
            ->get();

        $targetNodes = DB::table('trace_nodes')
            ->whereIn('id', $edges->pluck('target_node_id')->all())
            ->orderBy('id')
            ->get();

        $nodes = collect([$batchNode])
            ->concat($targetNodes)
            ->map(fn ($node) => $this->mapNode($node))
            ->values()
            ->all();

        $mappedEdges = $edges->map(fn ($edge) => $this->mapEdge($edge))->values()->all();

        return ['nodes' => $nodes, 'edges' => $mappedEdges];
    }

    /**
     * Eventos del grafo asociados al lote, en orden cronologico.
     *
     * @return array<int,array<string,mixed>>
     */
    private function loadEvents(int $importBatchId): array
    {
        return DB::table('trace_events')
            ->where('entity_type', 'import_batches')
            ->where('entity_id', $importBatchId)
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'event_type' => $row->event_type,
                'entity_type' => $row->entity_type,
                'entity_id' => $row->entity_id === null ? null : (int) $row->entity_id,
                'payload' => $this->decodeJson($row->payload),
                'created_at' => $row->created_at,
            ])
            ->all();
    }

    /**
     * Resumen de alertas de consistencia del lote (S5-BE-04).
     *
     * Devuelve conteos por severidad y estado. `open_critical` / `open_errors`
     * son los que pueden observar la huella; `total`, `critical`, `errors`,
     * `warnings` y `open` se exponen en el summary. No declara legalidad.
     *
     * @return array{total:int,critical:int,errors:int,warnings:int,info:int,open:int,open_critical:int,open_errors:int}
     */
    private function loadAlerts(int $importBatchId): array
    {
        $rows = DB::table('consistency_alerts')
            ->where('import_batch_id', $importBatchId)
            ->get(['severity', 'status']);

        $summary = [
            'total' => $rows->count(),
            'critical' => 0,
            'errors' => 0,
            'warnings' => 0,
            'info' => 0,
            'open' => 0,
            'open_critical' => 0,
            'open_errors' => 0,
        ];

        foreach ($rows as $row) {
            $severity = strtoupper((string) $row->severity);
            $isOpen = strtoupper((string) $row->status) === 'OPEN';

            match ($severity) {
                'CRITICAL' => $summary['critical']++,
                'ERROR' => $summary['errors']++,
                'WARNING' => $summary['warnings']++,
                'INFO' => $summary['info']++,
                default => null,
            };

            if ($isOpen) {
                $summary['open']++;

                if ($severity === 'CRITICAL') {
                    $summary['open_critical']++;
                } elseif ($severity === 'ERROR') {
                    $summary['open_errors']++;
                }
            }
        }

        return $summary;
    }

    /**
     * Forma estandar de un nodo del grafo.
     *
     * @return array<string,mixed>
     */
    private function mapNode(object $node): array
    {
        return [
            'id' => (int) $node->id,
            'type' => $node->node_type,
            'label' => $node->label,
            'status' => $node->status,
            'metadata' => $this->decodeJson($node->metadata),
        ];
    }

    /**
     * Forma estandar de una relacion del grafo.
     *
     * @return array<string,mixed>
     */
    private function mapEdge(object $edge): array
    {
        return [
            'id' => (int) $edge->id,
            'source' => (int) $edge->source_node_id,
            'target' => (int) $edge->target_node_id,
            'relation' => $edge->relation_type,
            'status' => $edge->status,
            'metadata' => $this->decodeJson($edge->metadata),
        ];
    }

    /**
     * Decodifica un valor jsonb a objeto/array para la respuesta JSON.
     *
     * Cuando el valor es null, vacio o JSON invalido devuelve un objeto vacio
     * ({} en JSON) para mantener una forma estable de objeto en las respuestas.
     */
    private function decodeJson(mixed $value): object|array
    {
        if (is_object($value)) {
            return $value;
        }

        if (is_array($value)) {
            return $value === [] ? (object) [] : $value;
        }

        if (! is_string($value) || $value === '') {
            return (object) [];
        }

        $decoded = json_decode($value);

        return $decoded === null ? (object) [] : $decoded;
    }
}
