<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

/**
 * Resumen tecnico del backend para la demo del hackathon (S6-BE-04).
 *
 * No certifica legalidad ni declara ilegalidad: describe el estado de los
 * modulos backend y los endpoints principales del flujo de verificacion tecnica.
 */
class DemoController extends Controller
{
    /**
     * Resumen del estado del backend y sus endpoints principales.
     *
     * `GET /api/demo/backend-summary`.
     */
    public function backendSummary(): JsonResponse
    {
        return response()->json([
            'data' => [
                'project' => 'Huella Legal Forestal',
                'backend_status' => 'READY_FOR_DEMO',
                'implemented_sprints' => 6,
                'modules' => [
                    'SaaS base',
                    'Conector interoperable',
                    'Grafo de trazabilidad',
                    'Huella Legal',
                    'Motor de consistencia y alertas',
                    'Snapshot y verificación pública',
                ],
                'core_endpoints' => [
                    'health' => '/api/health',
                    'import_batches' => '/api/import-batches',
                    'graph' => '/api/import-batches/{id}/graph',
                    'legal_footprint' => '/api/import-batches/{id}/legal-footprint',
                    'consistency' => '/api/import-batches/{id}/run-consistency',
                    'snapshot' => '/api/import-batches/{id}/legal-footprint/snapshot',
                    'verify' => '/api/legal-footprints/verify/{verificationCode}',
                ],
                'disclaimer' => 'El backend no certifica legalidad ni declara ilegalidad; verifica trazabilidad técnica, consistencia documental y evidencia disponible.',
            ],
        ]);
    }
}
