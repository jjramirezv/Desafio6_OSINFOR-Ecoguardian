<?php

namespace App\Modules\Interoperability\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Interoperability\Requests\NormalizeDemoImportBatchRequest;
use App\Modules\Interoperability\Requests\StoreImportBatchRequest;
use App\Modules\Interoperability\Services\OperationalPersistenceService;
use App\Modules\Interoperability\Services\SourceNormalizerService;
use App\Modules\TraceGraph\Services\GraphProjectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

/**
 * Registra y procesa lotes de importacion del conector interoperable.
 *
 * - store (S2-BE-04): persiste un lote en estado PENDING con contadores en cero.
 * - normalizeDemo (S2-BE-07): normaliza filas crudas demo y registra el
 *   resultado en source_records / import_errors, actualizando contadores del
 *   lote. No proyecta el grafo.
 * - project (S2-BE-08): proyecta el lote al grafo de trazabilidad usando la
 *   proyeccion base de GraphProjectionService.
 *
 * Aun no procesa archivos reales (Excel/PDF) ni crea tablas operativas.
 */
class ImportBatchController extends Controller
{
    /**
     * Lista los lotes de importacion del conector (S2-BE-13).
     *
     * Acepta filtros opcionales por status, import_type, source_system_id,
     * organization_id y un limit. Responde con la forma estandar de listado
     * del proyecto: { data: [...], meta: { total } }.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('import_batches')->orderByDesc('id');

            if (($status = $request->query('status')) !== null) {
                $query->where('status', $status);
            }

            if (($importType = $request->query('import_type')) !== null) {
                $query->where('import_type', $importType);
            }

            if (($sourceSystemId = $request->query('source_system_id')) !== null) {
                $query->where('source_system_id', (int) $sourceSystemId);
            }

            if (($organizationId = $request->query('organization_id')) !== null) {
                $query->where('organization_id', (int) $organizationId);
            }

            $total = (clone $query)->count();

            if (($limit = $request->query('limit')) !== null) {
                $query->limit((int) $limit);
            }

            $rows = $query->get()->map(fn ($row) => [
                'id' => (int) $row->id,
                'batch_code' => $row->batch_code,
                'name' => $row->name,
                'import_type' => $row->import_type,
                'status' => $row->status,
                'total_rows' => (int) $row->total_rows,
                'processed_rows' => (int) $row->processed_rows,
                'successful_rows' => (int) $row->successful_rows,
                'failed_rows' => (int) $row->failed_rows,
                'created_at' => $row->created_at,
            ]);

            return response()->json([
                'data' => $rows,
                'meta' => ['total' => $total],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudieron obtener los lotes de importacion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Detalle basico de un lote de importacion (S2-BE-13).
     */
    public function show(int $id): JsonResponse
    {
        $batch = DB::table('import_batches')->where('id', $id)->first();

        if ($batch === null) {
            return response()->json([
                'message' => "Import batch {$id} not found.",
            ], 404);
        }

        return response()->json([
            'data' => [
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
                'metadata' => $this->decodeJson($batch->metadata),
            ],
        ]);
    }

    /**
     * Lista los source_records asociados a un lote (S2-BE-13).
     *
     * Resuelve la relacion por metadata->import_batch_id, igual que el resto
     * del conector.
     */
    public function sourceRecords(int $id): JsonResponse
    {
        $batch = DB::table('import_batches')->where('id', $id)->first();

        if ($batch === null) {
            return response()->json([
                'message' => "Import batch {$id} not found.",
            ], 404);
        }

        $rows = DB::table('source_records')
            ->whereRaw("metadata->>'import_batch_id' = ?", [(string) $id])
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'record_type' => $row->record_type,
                'status' => $row->status,
                'external_id' => $row->external_id,
                'raw_payload' => $this->decodeJson($row->raw_payload),
                'normalized_payload' => $this->decodeJson($row->normalized_payload),
                'metadata' => $this->decodeJson($row->metadata),
            ]);

        return response()->json([
            'data' => $rows,
            'meta' => ['total' => $rows->count()],
        ]);
    }

    /**
     * Lista los import_errors de un lote (S2-BE-13).
     */
    public function errors(int $id): JsonResponse
    {
        $batch = DB::table('import_batches')->where('id', $id)->first();

        if ($batch === null) {
            return response()->json([
                'message' => "Import batch {$id} not found.",
            ], 404);
        }

        $rows = DB::table('import_errors')
            ->where('import_batch_id', $id)
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'row_number' => $row->row_number === null ? null : (int) $row->row_number,
                'field_name' => $row->field_name,
                'error_code' => $row->error_code,
                'error_message' => $row->error_message,
                'severity' => $row->severity,
                'metadata' => $this->decodeJson($row->metadata),
            ]);

        return response()->json([
            'data' => $rows,
            'meta' => ['total' => $rows->count()],
        ]);
    }

    /**
     * Registros operativos de un lote agrupados por tabla (S2-BE-13).
     *
     * Devuelve los registros de cada tabla operativa creados a partir del lote
     * (resueltos por import_batch_id) y, en meta, el conteo por tabla.
     */
    public function operationalRecords(int $id): JsonResponse
    {
        $batch = DB::table('import_batches')->where('id', $id)->first();

        if ($batch === null) {
            return response()->json([
                'message' => "Import batch {$id} not found.",
            ], 404);
        }

        $tables = [
            'operation_tala',
            'operation_trozado',
            'operation_despacho',
            'extraction_balances',
            'gtfs',
        ];

        $data = [];
        $meta = [];

        foreach ($tables as $table) {
            $rows = DB::table($table)
                ->where('import_batch_id', $id)
                ->orderBy('id')
                ->get();

            $data[$table] = $rows;
            $meta[$table] = $rows->count();
        }

        return response()->json([
            'data' => $data,
            'meta' => $meta,
        ]);
    }

    public function store(StoreImportBatchRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $now = now();

            $id = DB::table('import_batches')->insertGetId([
                'organization_id' => $data['organization_id'] ?? null,
                'source_system_id' => $data['source_system_id'] ?? null,
                'batch_code' => $data['batch_code'],
                'name' => $data['name'],
                'import_type' => $data['import_type'],
                'source_file_name' => $data['source_file_name'] ?? null,
                'source_file_path' => $data['source_file_path'] ?? null,
                'status' => 'PENDING',
                'total_rows' => 0,
                'processed_rows' => 0,
                'successful_rows' => 0,
                'failed_rows' => 0,
                'metadata' => isset($data['metadata'])
                    ? json_encode($data['metadata'])
                    : null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            return response()->json([
                'data' => [
                    'id' => $id,
                    'batch_code' => $data['batch_code'],
                    'name' => $data['name'],
                    'import_type' => $data['import_type'],
                    'status' => 'PENDING',
                    'total_rows' => 0,
                    'processed_rows' => 0,
                    'successful_rows' => 0,
                    'failed_rows' => 0,
                    'metadata' => $data['metadata'] ?? null,
                ],
                'message' => 'Import batch created successfully',
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo registrar el lote de importacion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Normaliza una lista de filas crudas demo y persiste el resultado (S2-BE-07).
     *
     * Por cada fila: normaliza con SourceNormalizerService usando el import_type
     * del lote; si la fila no tiene errores crea un source_record, si los tiene
     * crea los import_errors correspondientes. Al final actualiza los contadores
     * y el estado del lote. Toda la escritura ocurre dentro de una transaccion.
     */
    public function normalizeDemo(
        NormalizeDemoImportBatchRequest $request,
        SourceNormalizerService $normalizer,
        int $id
    ): JsonResponse {
        $batch = DB::table('import_batches')->where('id', $id)->first();

        if ($batch === null) {
            return response()->json([
                'message' => "Import batch {$id} not found.",
            ], 404);
        }

        $rows = $request->validated()['rows'];
        $importType = $batch->import_type;

        // source_records.source_system_id es obligatorio aunque el lote pueda no
        // tenerlo: resolver uno efectivo segun el import_type antes de persistir.
        $sourceSystemId = $this->resolveSourceSystemId($batch);

        if ($sourceSystemId === null) {
            return response()->json([
                'message' => 'Unable to resolve source system for this import type.',
            ], 422);
        }

        try {
            $result = DB::transaction(function () use ($batch, $rows, $importType, $normalizer, $sourceSystemId) {
                $now = now();

                $totalRows = count($rows);
                $successfulRows = 0;
                $failedRows = 0;
                $sourceRecordsCreated = 0;
                $errorsCreated = 0;

                foreach ($rows as $index => $row) {
                    $rowNumber = $index + 1;
                    $row = is_array($row) ? $row : [];

                    $normalization = $normalizer->normalizeRow($importType, $row);
                    $errors = $normalization['errors'];

                    if ($errors === []) {
                        $successfulRows++;
                        $sourceRecordsCreated++;

                        DB::table('source_records')->insert([
                            'source_system_id' => $sourceSystemId,
                            'external_id' => "BATCH-{$batch->id}-ROW-{$rowNumber}",
                            'record_type' => $importType,
                            'record_date' => null,
                            'raw_payload' => json_encode($row),
                            'normalized_payload' => json_encode($normalization['normalized']),
                            'status' => 'NORMALIZED',
                            'metadata' => json_encode([
                                'import_batch_id' => $batch->id,
                                'row_number' => $rowNumber,
                            ]),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);

                        continue;
                    }

                    $failedRows++;

                    foreach ($errors as $error) {
                        $errorsCreated++;

                        DB::table('import_errors')->insert([
                            'import_batch_id' => $batch->id,
                            'row_number' => $rowNumber,
                            'field_name' => $error['field'] ?? null,
                            'error_code' => $error['code'] ?? 'UNKNOWN_ERROR',
                            'error_message' => $error['message'] ?? 'Unknown error.',
                            'severity' => 'ERROR',
                            'metadata' => json_encode($error),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }
                }

                $status = $failedRows === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS';

                DB::table('import_batches')->where('id', $batch->id)->update([
                    'total_rows' => $totalRows,
                    'processed_rows' => $totalRows,
                    'successful_rows' => $successfulRows,
                    'failed_rows' => $failedRows,
                    'status' => $status,
                    'started_at' => $now,
                    'finished_at' => $now,
                    'updated_at' => $now,
                ]);

                return [
                    'import_batch_id' => $batch->id,
                    'import_type' => $importType,
                    'total_rows' => $totalRows,
                    'successful_rows' => $successfulRows,
                    'failed_rows' => $failedRows,
                    'source_records_created' => $sourceRecordsCreated,
                    'errors_created' => $errorsCreated,
                ];
            });

            return response()->json([
                'data' => $result,
                'message' => 'Import batch normalized successfully',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo normalizar el lote de importacion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Proyecta el lote al grafo de trazabilidad (S2-BE-08).
     *
     * Delega en la proyeccion base de GraphProjectionService, que asegura el
     * nodo EVENTO del lote y registra el evento IMPORT_BATCH_PROJECTED. Aun no
     * construye el grafo detallado de tala/trozado/GTF.
     */
    public function project(GraphProjectionService $projector, int $id): JsonResponse
    {
        try {
            $result = $projector->projectImportBatch($id);

            return response()->json([
                'data' => $result,
                'message' => 'Import batch projected successfully',
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo proyectar el lote de importacion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resuelve el source_system_id efectivo para crear source_records.
     *
     * Prioriza el del propio lote; si el lote no lo tiene, lo deriva del
     * import_type mapeando a source_systems.code. Devuelve null si no se puede
     * resolver (import_type desconocido o source_system inexistente).
     */
    private function resolveSourceSystemId(object $batch): ?int
    {
        if ($batch->source_system_id !== null) {
            return (int) $batch->source_system_id;
        }

        // Mapeo import_type -> source_systems.code.
        $codeByType = [
            'CENSO_FORESTAL' => 'CENSO_FORESTAL',
            'LIBRO_OPERACIONES_TALA' => 'LIBRO_OPERACIONES',
            'LIBRO_OPERACIONES_TROZADO' => 'LIBRO_OPERACIONES',
            'LIBRO_OPERACIONES_DESPACHO' => 'LIBRO_OPERACIONES',
            'BALANCE_EXTRACCION' => 'BALANCE_EXTRACCION',
            'GTF' => 'GTF',
        ];

        $importType = strtoupper(trim((string) $batch->import_type));
        $code = $codeByType[$importType] ?? null;

        if ($code === null) {
            return null;
        }

        $sourceSystemId = DB::table('source_systems')
            ->where('code', $code)
            ->value('id');

        return $sourceSystemId === null ? null : (int) $sourceSystemId;
    }

    /**
     * Decodifica un valor jsonb a objeto/array para la respuesta JSON.
     *
     * Cuando el valor es null, vacio o JSON invalido devuelve un objeto vacio
     * ({} en JSON) en lugar de un array vacio ([]), para mantener una forma
     * estable de objeto en las respuestas de consulta. Decodifica sin asociar
     * para preservar objetos como objetos (un {} permanece {}).
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

    /**
     * Persiste los source_records normalizados del lote en tablas operativas (S2-BE-12).
     *
     * Delega en OperationalPersistenceService. Idempotente: no duplica registros
     * operativos si se invoca varias veces.
     */
    public function persist(OperationalPersistenceService $persistence, int $id): JsonResponse
    {
        try {
            $result = $persistence->persistImportBatch($id);

            return response()->json([
                'data' => $result,
                'message' => 'Import batch persisted successfully',
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo persistir el lote de importacion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Proyecta los registros operativos del lote al grafo (S2-BE-12).
     *
     * Delega en GraphProjectionService::projectOperationalRecords.
     */
    public function projectOperational(GraphProjectionService $projector, int $id): JsonResponse
    {
        try {
            $result = $projector->projectOperationalRecords($id);

            return response()->json([
                'data' => $result,
                'message' => 'Operational records projected successfully',
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudieron proyectar los registros operativos.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resumen del lote: contadores, conteos por tabla y eventos del grafo (S2-BE-12).
     */
    public function summary(int $id): JsonResponse
    {
        $batch = DB::table('import_batches')->where('id', $id)->first();

        if ($batch === null) {
            return response()->json([
                'message' => "Import batch {$id} not found.",
            ], 404);
        }

        $sourceRecords = DB::table('source_records')
            ->whereRaw("metadata->>'import_batch_id' = ?", [(string) $id])
            ->count();

        $importErrors = DB::table('import_errors')->where('import_batch_id', $id)->count();
        $operationTala = DB::table('operation_tala')->where('import_batch_id', $id)->count();
        $operationTrozado = DB::table('operation_trozado')->where('import_batch_id', $id)->count();
        $operationDespacho = DB::table('operation_despacho')->where('import_batch_id', $id)->count();
        $extractionBalances = DB::table('extraction_balances')->where('import_batch_id', $id)->count();
        $gtfs = DB::table('gtfs')->where('import_batch_id', $id)->count();

        $events = DB::table('trace_events')
            ->where('entity_type', 'import_batches')
            ->where('entity_id', $id)
            ->count();

        return response()->json([
            'data' => [
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
                'records' => [
                    'source_records' => $sourceRecords,
                    'import_errors' => $importErrors,
                    'operation_tala' => $operationTala,
                    'operation_trozado' => $operationTrozado,
                    'operation_despacho' => $operationDespacho,
                    'extraction_balances' => $extractionBalances,
                    'gtfs' => $gtfs,
                ],
                'graph' => [
                    'events' => $events,
                ],
            ],
        ]);
    }
}
