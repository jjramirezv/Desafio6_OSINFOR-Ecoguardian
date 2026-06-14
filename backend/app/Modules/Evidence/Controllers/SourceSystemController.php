<?php

namespace App\Modules\Evidence\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Lista los sistemas fuente registrados (SIGOsfc, alertas, censo, etc.).
 *
 * Endpoint de solo lectura del Sprint 1. Sin autenticacion ni paginacion:
 * el volumen de fuentes es pequeno y estable.
 */
class SourceSystemController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $rows = DB::table('source_systems')
                ->select('id', 'name', 'code', 'type', 'integration_type', 'status')
                ->orderBy('id')
                ->get();

            return response()->json([
                'data' => $rows,
                'meta' => ['total' => $rows->count()],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudieron obtener los sistemas fuente.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
