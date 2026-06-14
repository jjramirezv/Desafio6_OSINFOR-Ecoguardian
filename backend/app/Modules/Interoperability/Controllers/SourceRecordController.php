<?php

namespace App\Modules\Interoperability\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Consulta de detalle de un source_record del conector interoperable (S2-BE-14).
 *
 * Solo lectura: no expone update ni delete todavia. Mantiene DB::table en lugar
 * de Eloquent, alineado con el resto del conector.
 */
class SourceRecordController extends Controller
{
    /**
     * Detalle de un source_record por id. 404 si no existe.
     */
    public function show(int $id): JsonResponse
    {
        $record = DB::table('source_records')->where('id', $id)->first();

        if ($record === null) {
            return response()->json([
                'message' => "Source record {$id} not found.",
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => (int) $record->id,
                'source_system_id' => $record->source_system_id === null
                    ? null
                    : (int) $record->source_system_id,
                'external_id' => $record->external_id,
                'record_type' => $record->record_type,
                'record_date' => $record->record_date,
                'status' => $record->status,
                'raw_payload' => $this->decodeJson($record->raw_payload),
                'normalized_payload' => $this->decodeJson($record->normalized_payload),
                'metadata' => $this->decodeJson($record->metadata),
                'created_at' => $record->created_at,
            ],
        ]);
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
}
