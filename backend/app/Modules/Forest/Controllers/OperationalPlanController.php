<?php

namespace App\Modules\Forest\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Lista los planes operativos. Endpoint de solo lectura del Sprint 1.
 */
class OperationalPlanController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $rows = DB::table('operational_plans')
                ->select(
                    'id',
                    'forest_title_id',
                    'code',
                    'name',
                    'period_start',
                    'period_end',
                    'status',
                    'approved_volume',
                )
                ->orderBy('id')
                ->get();

            return response()->json([
                'data' => $rows,
                'meta' => ['total' => $rows->count()],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudieron obtener los planes operativos.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
