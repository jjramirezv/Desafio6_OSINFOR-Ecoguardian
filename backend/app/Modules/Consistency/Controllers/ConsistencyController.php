<?php

namespace App\Modules\Consistency\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Consistency\Services\ConsistencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

/**
 * Endpoints del motor de consistencia y alertas por lote (S5-BE-03).
 *
 * - runConsistency: ejecuta las reglas y persiste las alertas del lote.
 * - alerts: lista las alertas de un lote, con filtros opcionales.
 * - show: detalle de una alerta.
 * - updateStatus: cambia el estado de revision de una alerta.
 *
 * Ninguno de los endpoints declara legalidad: las alertas son observaciones
 * tecnicas/documentales para revision.
 */
class ConsistencyController extends Controller
{
    /**
     * Estados de revision validos para una alerta.
     *
     * @var list<string>
     */
    private const VALID_STATUSES = ['OPEN', 'REVIEWED', 'DISMISSED', 'RESOLVED'];

    /**
     * Ejecuta el motor de consistencia sobre un lote.
     *
     * `POST /api/import-batches/{id}/run-consistency`. Si el lote no existe: 404.
     */
    public function runConsistency(ConsistencyService $service, int $id): JsonResponse
    {
        try {
            $summary = $service->runForImportBatch($id);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo ejecutar el motor de consistencia del lote.',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'data' => $summary,
            'message' => 'Consistency check completed successfully',
        ]);
    }

    /**
     * Lista las alertas de consistencia de un lote (S5-BE-03).
     *
     * `GET /api/import-batches/{id}/alerts`. Filtros opcionales: severity,
     * status, alert_type. Si el lote no existe: 404.
     */
    public function alerts(Request $request, int $id): JsonResponse
    {
        $batch = DB::table('import_batches')->where('id', $id)->first();

        if ($batch === null) {
            return response()->json([
                'message' => "Import batch {$id} not found.",
            ], 404);
        }

        $query = DB::table('consistency_alerts')
            ->where('import_batch_id', $id)
            ->orderBy('id');

        if (($severity = $request->query('severity')) !== null) {
            $query->where('severity', $severity);
        }

        if (($status = $request->query('status')) !== null) {
            $query->where('status', $status);
        }

        if (($alertType = $request->query('alert_type')) !== null) {
            $query->where('alert_type', $alertType);
        }

        $rows = $query->get()->map(fn ($row) => $this->mapAlert($row));

        return response()->json([
            'data' => $rows,
            'meta' => ['total' => $rows->count()],
        ]);
    }

    /**
     * Detalle de una alerta de consistencia (S5-BE-03).
     *
     * `GET /api/consistency-alerts/{id}`. Si no existe: 404.
     */
    public function show(int $id): JsonResponse
    {
        $alert = DB::table('consistency_alerts')->where('id', $id)->first();

        if ($alert === null) {
            return response()->json([
                'message' => "Consistency alert {$id} not found.",
            ], 404);
        }

        return response()->json([
            'data' => $this->mapAlert($alert),
        ]);
    }

    /**
     * Cambia el estado de revision de una alerta (S5-BE-03).
     *
     * `PATCH /api/consistency-alerts/{id}/status`. Valida el status contra los
     * estados permitidos. Si la alerta no existe: 404; si el status es invalido:
     * 422.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $alert = DB::table('consistency_alerts')->where('id', $id)->first();

        if ($alert === null) {
            return response()->json([
                'message' => "Consistency alert {$id} not found.",
            ], 404);
        }

        $status = $request->input('status');

        if (! is_string($status) || ! in_array($status, self::VALID_STATUSES, true)) {
            return response()->json([
                'message' => 'The provided status is invalid.',
                'errors' => [
                    'status' => ['The status must be one of: '.implode(', ', self::VALID_STATUSES).'.'],
                ],
            ], 422);
        }

        DB::table('consistency_alerts')->where('id', $id)->update([
            'status' => $status,
            'updated_at' => now(),
        ]);

        $updated = DB::table('consistency_alerts')->where('id', $id)->first();

        return response()->json([
            'data' => $this->mapAlert($updated),
            'message' => 'Consistency alert status updated successfully',
        ]);
    }

    /**
     * Forma estandar de una alerta para las respuestas.
     *
     * @return array<string,mixed>
     */
    private function mapAlert(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'import_batch_id' => $row->import_batch_id === null ? null : (int) $row->import_batch_id,
            'source_record_id' => $row->source_record_id === null ? null : (int) $row->source_record_id,
            'entity_type' => $row->entity_type,
            'entity_id' => $row->entity_id === null ? null : (int) $row->entity_id,
            'alert_code' => $row->alert_code,
            'alert_type' => $row->alert_type,
            'severity' => $row->severity,
            'title' => $row->title,
            'description' => $row->description,
            'status' => $row->status,
            'evidence' => $this->decodeJson($row->evidence),
            'metadata' => $this->decodeJson($row->metadata),
            'created_at' => $row->created_at,
            'updated_at' => $row->updated_at,
        ];
    }

    /**
     * Decodifica un valor jsonb a objeto/array para la respuesta JSON.
     *
     * Mantiene la misma forma estable ({} para valores vacios) que el resto de
     * los controladores del proyecto.
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
