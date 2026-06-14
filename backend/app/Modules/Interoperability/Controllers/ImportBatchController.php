<?php

namespace App\Modules\Interoperability\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Interoperability\Requests\StoreImportBatchRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Registra lotes de importacion del conector interoperable (S2-BE-04).
 *
 * En este bloque solo se persiste el lote en estado PENDING con contadores en
 * cero. No procesa archivos, no genera errores de importacion, no crea
 * source_records ni proyecta el grafo de trazabilidad: eso llega en bloques
 * posteriores del Sprint 2.
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
}
