<?php

namespace App\Modules\Forest\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Lista los titulos habilitantes con su organizacion asociada (si existe).
 *
 * Endpoint de solo lectura del Sprint 1.
 */
class ForestTitleController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $rows = DB::table('forest_titles as ft')
                ->leftJoin('organizations as o', 'ft.organization_id', '=', 'o.id')
                ->select(
                    'ft.id',
                    'ft.code',
                    'ft.name',
                    'ft.holder_name',
                    'ft.title_type',
                    'ft.status',
                    'o.id as organization_id',
                    'o.name as organization_name',
                    'o.code as organization_code',
                    'o.type as organization_type',
                )
                ->orderBy('ft.id')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'code' => $row->code,
                        'name' => $row->name,
                        'holder_name' => $row->holder_name,
                        'title_type' => $row->title_type,
                        'status' => $row->status,
                        'organization' => $row->organization_id === null ? null : [
                            'id' => $row->organization_id,
                            'name' => $row->organization_name,
                            'code' => $row->organization_code,
                            'type' => $row->organization_type,
                        ],
                    ];
                });

            return response()->json([
                'data' => $rows,
                'meta' => ['total' => $rows->count()],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudieron obtener los titulos forestales.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
