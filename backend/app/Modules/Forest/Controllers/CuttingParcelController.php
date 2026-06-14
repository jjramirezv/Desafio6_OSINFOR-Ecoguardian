<?php

namespace App\Modules\Forest\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Lista las parcelas de corta. Endpoint de solo lectura del Sprint 1.
 */
class CuttingParcelController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $rows = DB::table('cutting_parcels')
                ->select(
                    'id',
                    'operational_plan_id',
                    'code',
                    'name',
                    'authorized_trees_count',
                    'authorized_volume',
                    'status',
                )
                ->orderBy('id')
                ->get();

            return response()->json([
                'data' => $rows,
                'meta' => ['total' => $rows->count()],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudieron obtener las parcelas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
