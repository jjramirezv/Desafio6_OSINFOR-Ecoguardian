<?php

namespace App\Modules\Forest\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Lista los arboles censados. Endpoint de solo lectura del Sprint 1.
 */
class CensusTreeController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $rows = DB::table('census_trees')
                ->select(
                    'id',
                    'cutting_parcel_id',
                    'tree_code',
                    'species',
                    'scientific_name',
                    'authorized_volume',
                    'diameter',
                    'height',
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
                'message' => 'No se pudieron obtener los arboles censados.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
