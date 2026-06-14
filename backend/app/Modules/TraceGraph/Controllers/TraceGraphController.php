<?php

namespace App\Modules\TraceGraph\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Consultas de trazabilidad sobre el grafo de evidencia (Sprint 3).
 *
 * - neighbors (S3-BE-03): trazabilidad inversa/directa de un nodo, devolviendo
 *   el nodo central, sus relaciones entrantes y salientes y los nodos vecinos.
 * - search (S3-BE-04): busqueda simple de nodos por label.
 *
 * Usa DB::table en lugar de Eloquent para mantenerse alineado con el resto del
 * modulo de grafo y del conector interoperable.
 */
class TraceGraphController extends Controller
{
    /**
     * Vecindario de un nodo del grafo (S3-BE-03).
     *
     * Devuelve el nodo central, las relaciones salientes y entrantes, y los
     * nodos relacionados (vecinos) por ambos sentidos. Si el nodo no existe: 404.
     */
    public function neighbors(int $id): JsonResponse
    {
        try {
            $node = DB::table('trace_nodes')->where('id', $id)->first();

            if ($node === null) {
                return response()->json([
                    'message' => "Trace node {$id} not found.",
                ], 404);
            }

            $outgoing = DB::table('trace_edges')
                ->where('source_node_id', $id)
                ->orderBy('id')
                ->get();

            $incoming = DB::table('trace_edges')
                ->where('target_node_id', $id)
                ->orderBy('id')
                ->get();

            $edges = $outgoing->concat($incoming);

            $neighborIds = $outgoing->pluck('target_node_id')
                ->concat($incoming->pluck('source_node_id'))
                ->map(fn ($value) => (int) $value)
                ->reject(fn ($value) => $value === $id)
                ->unique()
                ->values()
                ->all();

            $neighbors = DB::table('trace_nodes')
                ->whereIn('id', $neighborIds)
                ->orderBy('id')
                ->get()
                ->map(fn ($row) => $this->mapNode($row))
                ->values();

            $mappedEdges = $edges
                ->map(fn ($row) => $this->mapEdge($row))
                ->values();

            return response()->json([
                'data' => [
                    'node' => $this->mapNode($node),
                    'neighbors' => $neighbors,
                    'edges' => $mappedEdges,
                ],
                'meta' => [
                    'neighbors_count' => $neighbors->count(),
                    'edges_count' => $mappedEdges->count(),
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo obtener el vecindario del nodo.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Busqueda simple de nodos por label (S3-BE-04).
     *
     * Busca de forma insensible a mayusculas en trace_nodes.label y devuelve un
     * maximo de 20 resultados. Si no llega q (o viene vacio), devuelve data=[].
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $q = $request->query('q');

            if ($q === null || trim((string) $q) === '') {
                return response()->json([
                    'data' => [],
                    'meta' => ['total' => 0],
                ]);
            }

            $rows = DB::table('trace_nodes')
                ->where('label', 'ILIKE', '%'.$q.'%')
                ->orderBy('id')
                ->limit(20)
                ->get()
                ->map(fn ($row) => $this->mapNode($row))
                ->values();

            return response()->json([
                'data' => $rows,
                'meta' => ['total' => $rows->count()],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo ejecutar la busqueda en el grafo.',
                'error' => $e->getMessage(),
            ], 500);
        }
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
