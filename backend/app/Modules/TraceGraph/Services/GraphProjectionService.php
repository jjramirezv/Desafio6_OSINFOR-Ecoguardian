<?php

namespace App\Modules\TraceGraph\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Capa base de proyeccion al grafo de trazabilidad (S2-BE-06).
 *
 * Crea o asegura nodos (trace_nodes) y relaciones (trace_edges) de forma
 * idempotente, y proyecta un lote de importacion como evento del grafo. Usa
 * DB::table en lugar de Eloquent para mantenerse alineado con el resto del
 * conector interoperable.
 *
 * Esta version es deliberadamente conservadora: no construye el grafo completo
 * ni crea relaciones tala/trozado/despacho; eso llega en bloques posteriores.
 */
class GraphProjectionService
{
    /**
     * Asegura la existencia de un nodo y devuelve su id (idempotente).
     *
     * Busca por (node_type, label, entity_table, entity_id). Si existe lo
     * devuelve; si no, lo crea con status ACTIVE.
     *
     * @param  array<string,mixed>  $metadata
     */
    public function ensureNode(
        string $nodeType,
        string $label,
        ?string $entityTable = null,
        ?int $entityId = null,
        array $metadata = []
    ): int {
        $existing = DB::table('trace_nodes')
            ->where('node_type', $nodeType)
            ->where('label', $label)
            ->where(function ($query) use ($entityTable) {
                $entityTable === null
                    ? $query->whereNull('entity_table')
                    : $query->where('entity_table', $entityTable);
            })
            ->where(function ($query) use ($entityId) {
                $entityId === null
                    ? $query->whereNull('entity_id')
                    : $query->where('entity_id', $entityId);
            })
            ->value('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        $now = now();

        return (int) DB::table('trace_nodes')->insertGetId([
            'node_type' => $nodeType,
            'label' => $label,
            'entity_table' => $entityTable,
            'entity_id' => $entityId,
            'status' => 'ACTIVE',
            'metadata' => $metadata === [] ? null : json_encode($metadata),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * Asegura la existencia de una relacion y devuelve su id (idempotente).
     *
     * Busca por (source_node_id, target_node_id, relation_type). Si existe la
     * devuelve; si no, la crea con status ACTIVE.
     *
     * @param  array<string,mixed>  $metadata
     */
    public function ensureEdge(
        int $sourceNodeId,
        int $targetNodeId,
        string $relationType,
        array $metadata = []
    ): int {
        $existing = DB::table('trace_edges')
            ->where('source_node_id', $sourceNodeId)
            ->where('target_node_id', $targetNodeId)
            ->where('relation_type', $relationType)
            ->value('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        $now = now();

        return (int) DB::table('trace_edges')->insertGetId([
            'source_node_id' => $sourceNodeId,
            'target_node_id' => $targetNodeId,
            'relation_type' => $relationType,
            'status' => 'ACTIVE',
            'metadata' => $metadata === [] ? null : json_encode($metadata),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * Proyecta un lote de importacion al grafo de trazabilidad.
     *
     * Version base y conservadora: asegura un nodo EVENTO que representa el lote
     * y registra un evento IMPORT_BATCH_PROJECTED en trace_events. No crea aun
     * nodos/relaciones de las entidades operativas.
     *
     * @return array{import_batch_id:int,nodes_created_or_found:int,edges_created_or_found:int,events_created:int}
     *
     * @throws InvalidArgumentException si el lote no existe.
     */
    public function projectImportBatch(int $importBatchId): array
    {
        $batch = DB::table('import_batches')->where('id', $importBatchId)->first();

        if ($batch === null) {
            throw new InvalidArgumentException("Import batch {$importBatchId} not found.");
        }

        $label = $batch->batch_code ?? "import-batch-{$importBatchId}";

        // Nodo tipo EVENTO (no se introducen tipos nuevos en Sprint 1/2). El
        // caracter de lote de importacion se distingue por la metadata.
        $nodeId = $this->ensureNode(
            'EVENTO',
            $label,
            'import_batches',
            $importBatchId,
            [
                'projection_type' => 'IMPORT_BATCH',
                'batch_code' => $batch->batch_code ?? null,
                'import_type' => $batch->import_type ?? null,
            ]
        );

        $now = now();

        DB::table('trace_events')->insert([
            'event_type' => 'IMPORT_BATCH_PROJECTED',
            'entity_type' => 'import_batches',
            'entity_id' => $importBatchId,
            'source_system_id' => $batch->source_system_id ?? null,
            'payload' => json_encode([
                'import_batch_id' => $importBatchId,
                'batch_code' => $batch->batch_code ?? null,
                'import_type' => $batch->import_type ?? null,
                'trace_node_id' => $nodeId,
            ]),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return [
            'import_batch_id' => $importBatchId,
            'nodes_created_or_found' => 1,
            'edges_created_or_found' => 0,
            'events_created' => 1,
        ];
    }

    /**
     * Proyecta los registros operativos persistidos de un lote al grafo (S2-BE-11).
     *
     * Asegura el nodo EVENTO del lote (mismo criterio que projectImportBatch) y,
     * por cada registro operativo del lote, crea un nodo basico y una relacion
     * REGISTRA desde el nodo del lote. Registra ademas un evento
     * OPERATIONAL_RECORDS_PROJECTED. Nodos y relaciones son idempotentes; el
     * evento se registra en cada llamada.
     *
     * Aun no construye el grafo forestal completo (tala -> trozado -> despacho).
     *
     * @return array{import_batch_id:int,nodes_created_or_found:int,edges_created_or_found:int,events_created:int}
     *
     * @throws InvalidArgumentException si el lote no existe.
     */
    public function projectOperationalRecords(int $importBatchId): array
    {
        $batch = DB::table('import_batches')->where('id', $importBatchId)->first();

        if ($batch === null) {
            throw new InvalidArgumentException("Import batch {$importBatchId} not found.");
        }

        // Nodo del lote, con el mismo criterio que projectImportBatch para
        // reutilizar el nodo si ya fue proyectado.
        $batchLabel = $batch->batch_code ?? "import-batch-{$importBatchId}";
        $batchNodeId = $this->ensureNode(
            'EVENTO',
            $batchLabel,
            'import_batches',
            $importBatchId,
            [
                'projection_type' => 'IMPORT_BATCH',
                'batch_code' => $batch->batch_code ?? null,
                'import_type' => $batch->import_type ?? null,
            ]
        );

        $nodesCreatedOrFound = 0;
        $edgesCreatedOrFound = 0;

        // Definicion de cada tabla operativa y como derivar su nodo.
        $sources = [
            [
                'table' => 'operation_tala',
                'node_type' => 'EVENTO',
                'label' => fn ($r) => 'Tala '.($r->tree_code ?? $r->tala_code ?? $r->id),
            ],
            [
                'table' => 'operation_trozado',
                'node_type' => 'EVENTO',
                'label' => fn ($r) => 'Trozado '.($r->piece_code ?? $r->trozado_code ?? $r->id),
            ],
            [
                'table' => 'operation_despacho',
                'node_type' => 'EVENTO',
                'label' => fn ($r) => 'Despacho '.($r->despacho_code ?? $r->dispatch_document ?? $r->id),
            ],
            [
                'table' => 'extraction_balances',
                'node_type' => 'BALANCE',
                'label' => fn ($r) => 'Balance '.($r->balance_code ?? $r->species ?? $r->id),
            ],
            [
                'table' => 'gtfs',
                'node_type' => 'GTF',
                'label' => fn ($r) => 'GTF '.($r->gtf_number ?? $r->id),
            ],
        ];

        foreach ($sources as $source) {
            $rows = DB::table($source['table'])
                ->where('import_batch_id', $importBatchId)
                ->orderBy('id')
                ->get();

            foreach ($rows as $row) {
                $nodeId = $this->ensureNode(
                    $source['node_type'],
                    ($source['label'])($row),
                    $source['table'],
                    (int) $row->id,
                    [
                        'projection_type' => 'OPERATIONAL_RECORD',
                        'import_batch_id' => $importBatchId,
                    ]
                );
                $nodesCreatedOrFound++;

                $this->ensureEdge($batchNodeId, $nodeId, 'REGISTRA', [
                    'import_batch_id' => $importBatchId,
                    'source_table' => $source['table'],
                ]);
                $edgesCreatedOrFound++;
            }
        }

        $now = now();

        DB::table('trace_events')->insert([
            'event_type' => 'OPERATIONAL_RECORDS_PROJECTED',
            'entity_type' => 'import_batches',
            'entity_id' => $importBatchId,
            'source_system_id' => $batch->source_system_id ?? null,
            'payload' => json_encode([
                'import_batch_id' => $importBatchId,
                'batch_code' => $batch->batch_code ?? null,
                'import_type' => $batch->import_type ?? null,
                'batch_node_id' => $batchNodeId,
                'nodes_created_or_found' => $nodesCreatedOrFound,
                'edges_created_or_found' => $edgesCreatedOrFound,
            ]),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return [
            'import_batch_id' => $importBatchId,
            'nodes_created_or_found' => $nodesCreatedOrFound,
            'edges_created_or_found' => $edgesCreatedOrFound,
            'events_created' => 1,
        ];
    }
}
