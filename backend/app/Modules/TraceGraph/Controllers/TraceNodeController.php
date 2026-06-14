<?php

namespace App\Modules\TraceGraph\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Lista los nodos del grafo de evidencia. Endpoint de solo lectura del Sprint 1.
 *
 * La columna metadata es jsonb; PostgreSQL la entrega como string, por lo que
 * se decodifica para devolver JSON anidado real (no una cadena escapada).
 */
class TraceNodeController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $rows = DB::table('trace_nodes')
                ->select(
                    'id',
                    'node_type',
                    'label',
                    'entity_table',
                    'entity_id',
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
                'message' => 'No se pudieron obtener los nodos del grafo.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
