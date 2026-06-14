<?php

namespace App\Modules\TraceGraph\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Devuelve el grafo semilla en un formato listo para el frontend (nodes/edges).
 *
 * El grafo NO esta hardcodeado: se lee siempre desde las tablas trace_nodes y
 * trace_edges. La etiqueta del caso (meta.case) se deriva del evento de
 * trazabilidad GRAFO_SEMILLA_CREADO si existe, con respaldo al primer nodo
 * ENTIDAD.
 */
class GraphSeedController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $nodes = DB::table('trace_nodes')
                ->select('id', 'node_type', 'label', 'status', 'metadata')
                ->orderBy('id')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'type' => $row->node_type,
                        'label' => $row->label,
                        'status' => $row->status,
                        'metadata' => $row->metadata === null
                            ? (object) []
                            : json_decode($row->metadata),
                    ];
                });

            $edges = DB::table('trace_edges')
                ->select('id', 'source_node_id', 'target_node_id', 'relation_type', 'status', 'metadata')
                ->orderBy('id')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'source' => $row->source_node_id,
                        'target' => $row->target_node_id,
                        'relation' => $row->relation_type,
                        'status' => $row->status,
                        'metadata' => $row->metadata === null
                            ? (object) []
                            : json_decode($row->metadata),
                    ];
                });

            return response()->json([
                'nodes' => $nodes,
                'edges' => $edges,
                'meta' => [
                    'nodes_count' => $nodes->count(),
                    'edges_count' => $edges->count(),
                    'case' => $this->resolveCaseLabel(),
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo obtener el grafo semilla.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Deriva la etiqueta del caso desde el evento semilla o, en su defecto,
     * desde el primer nodo de tipo ENTIDAD. Nunca se hardcodea el grafo.
     */
    private function resolveCaseLabel(): ?string
    {
        $event = DB::table('trace_events')
            ->where('event_type', 'GRAFO_SEMILLA_CREADO')
            ->orderByDesc('id')
            ->value('payload');

        if ($event !== null) {
            $payload = json_decode($event, true);

            if (is_array($payload) && ! empty($payload['case'])) {
                return $payload['case'];
            }
        }

        return DB::table('trace_nodes')
            ->where('node_type', 'ENTIDAD')
            ->orderBy('id')
            ->value('label');
    }
}
