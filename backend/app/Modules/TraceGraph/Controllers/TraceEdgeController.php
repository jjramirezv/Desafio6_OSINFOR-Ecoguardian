<?php

namespace App\Modules\TraceGraph\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Lista las relaciones del grafo de evidencia. Endpoint de solo lectura.
 *
 * La columna metadata es jsonb; se decodifica para devolver JSON anidado real.
 */
class TraceEdgeController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $rows = DB::table('trace_edges')
                ->select(
                    'id',
                    'source_node_id',
                    'target_node_id',
                    'relation_type',
                    'status',
                    'metadata',
                )
                ->orderBy('id')
                ->get()
                ->map(function ($row) {
                    $row->metadata = $row->metadata === null
                        ? null
                        : json_decode($row->metadata, true);

                    return $row;
                });

            return response()->json([
                'data' => $rows,
                'meta' => ['total' => $rows->count()],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudieron obtener las relaciones del grafo.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
