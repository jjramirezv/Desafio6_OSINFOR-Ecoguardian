<?php

namespace App\Modules\LegalFootprint\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LegalFootprint\Services\LegalFootprintSnapshotService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;
use Throwable;

/**
 * Snapshots y verificacion publica de la Huella Legal (S6-BE-03).
 *
 * - store: genera y persiste un snapshot tecnico de un lote.
 * - verify: endpoint publico de verificacion tecnica por codigo.
 *
 * Ninguno certifica legalidad ni declara ilegalidad: solo congelan y exponen el
 * estado tecnico de la cadena (TRACEABLE / OBSERVED / INCOMPLETE).
 */
class LegalFootprintSnapshotController extends Controller
{
    /**
     * Genera un snapshot de la huella legal de un lote (S6-BE-03).
     *
     * `POST /api/import-batches/{id}/legal-footprint/snapshot`. Si el lote no
     * existe: 404.
     */
    public function store(LegalFootprintSnapshotService $service, int $id): JsonResponse
    {
        try {
            $snapshot = $service->createFromImportBatch($id);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo generar el snapshot de la huella legal.',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'data' => [
                'id' => $snapshot['id'],
                'verification_code' => $snapshot['verification_code'],
                'footprint_hash' => $snapshot['footprint_hash'],
                'status' => $snapshot['status'],
                'score' => $snapshot['score'],
                'generated_at' => $snapshot['generated_at'],
            ],
            'message' => 'Legal footprint snapshot generated successfully',
        ]);
    }

    /**
     * Verificacion publica de un snapshot por su codigo (S6-BE-03).
     *
     * `GET /api/legal-footprints/verify/{verificationCode}`. Si el codigo no
     * existe: 404. Respuesta compacta lista para QR/API.
     */
    public function verify(LegalFootprintSnapshotService $service, string $verificationCode): JsonResponse
    {
        $snapshot = $service->findByVerificationCode($verificationCode);

        if ($snapshot === null) {
            return response()->json([
                'message' => "Verification code {$verificationCode} not found.",
            ], 404);
        }

        return response()->json([
            'data' => $service->buildPublicPayload($snapshot),
        ]);
    }
}
