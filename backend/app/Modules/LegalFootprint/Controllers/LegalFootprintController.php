<?php

namespace App\Modules\LegalFootprint\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LegalFootprint\Services\LegalFootprintService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;
use Throwable;

/**
 * Expone la "Huella Legal" backend de un lote de importacion (S4-BE-02, S4-BE-03).
 *
 * - show: huella completa (subgrafo verificable) de un lote.
 * - summary: vista compacta para verificacion tecnica rapida.
 *
 * Ninguno de los endpoints certifica legalidad ni declara ilegalidad: solo
 * resumen el estado tecnico de la cadena (TRACEABLE / OBSERVED / INCOMPLETE).
 */
class LegalFootprintController extends Controller
{
    /**
     * Mensajes tecnicos por estado de la huella.
     *
     * @var array<string,string>
     */
    private const STATUS_MESSAGES = [
        'TRACEABLE' => 'La huella presenta trazabilidad técnica suficiente para revisión.',
        'OBSERVED' => 'La huella presenta observaciones que deben revisarse.',
        'INCOMPLETE' => 'La huella está incompleta y requiere más evidencia.',
    ];

    /**
     * Huella legal completa de un lote (S4-BE-02).
     *
     * `GET /api/import-batches/{id}/legal-footprint`. Si el lote no existe: 404.
     */
    public function show(LegalFootprintService $service, int $id): JsonResponse
    {
        try {
            $footprint = $service->buildFromImportBatch($id);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo generar la huella legal del lote.',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'data' => [
                'import_batch' => $footprint['import_batch'],
                'status' => $footprint['status'],
                'completeness' => $footprint['completeness'],
                'source_records' => $footprint['source_records'],
                'errors' => $footprint['errors'],
                'operational_records' => $footprint['operational_records'],
                'graph' => $footprint['graph'],
                'events' => $footprint['events'],
                'alerts' => $this->alertsBlock($footprint['alerts']),
            ],
            'message' => 'Legal footprint generated successfully',
        ]);
    }

    /**
     * Resumen compacto de la huella para verificacion tecnica (S4-BE-03).
     *
     * `GET /api/import-batches/{id}/legal-footprint/summary`. Si el lote no
     * existe: 404.
     */
    public function summary(LegalFootprintService $service, int $id): JsonResponse
    {
        try {
            $footprint = $service->buildFromImportBatch($id);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo generar el resumen de la huella legal.',
                'error' => $e->getMessage(),
            ], 500);
        }

        $batch = $footprint['import_batch'];
        $status = $footprint['status'];

        $operationalCount = 0;
        foreach ($footprint['operational_records'] as $rows) {
            $operationalCount += count($rows);
        }

        return response()->json([
            'data' => [
                'import_batch_id' => $batch['id'],
                'batch_code' => $batch['batch_code'],
                'import_type' => $batch['import_type'],
                'status' => $status,
                'score' => $footprint['completeness']['score'],
                'counts' => [
                    'source_records' => count($footprint['source_records']),
                    'errors' => count($footprint['errors']),
                    'operational_records' => $operationalCount,
                    'graph_nodes' => count($footprint['graph']['nodes']),
                    'graph_edges' => count($footprint['graph']['edges']),
                    'events' => count($footprint['events']),
                ],
                'alerts' => $this->alertsBlock($footprint['alerts']),
                'message' => self::STATUS_MESSAGES[$status] ?? self::STATUS_MESSAGES['INCOMPLETE'],
            ],
        ]);
    }

    /**
     * Bloque compacto de alertas de consistencia para las respuestas (S5-BE-04).
     *
     * Expone solo los conteos publicos; los auxiliares open_critical/open_errors
     * que usa el calculo de estado quedan internos al servicio.
     *
     * @param  array<string,int>  $alerts
     * @return array{total:int,critical:int,errors:int,warnings:int,open:int}
     */
    private function alertsBlock(array $alerts): array
    {
        return [
            'total' => $alerts['total'] ?? 0,
            'critical' => $alerts['critical'] ?? 0,
            'errors' => $alerts['errors'] ?? 0,
            'warnings' => $alerts['warnings'] ?? 0,
            'open' => $alerts['open'] ?? 0,
        ];
    }
}
