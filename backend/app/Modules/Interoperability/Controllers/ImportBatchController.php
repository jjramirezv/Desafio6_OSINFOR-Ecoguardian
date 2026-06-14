<?php

namespace App\Modules\Interoperability\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Interoperability\Requests\NormalizeDemoImportBatchRequest;
use App\Modules\Interoperability\Requests\StoreImportBatchRequest;
use App\Modules\Interoperability\Services\SourceNormalizerService;
use App\Modules\TraceGraph\Services\GraphProjectionService;
use Illuminate\Http\JsonResponse;
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

        try {
            $result = DB::transaction(function () use ($batch, $rows, $importType, $normalizer) {
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
                            'source_system_id' => $batch->source_system_id,
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
}
