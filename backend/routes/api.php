<?php

use App\Http\Controllers\HealthController;
use App\Modules\Evidence\Controllers\SourceSystemController;
use App\Modules\Forest\Controllers\CensusTreeController;
use App\Modules\Forest\Controllers\CuttingParcelController;
use App\Modules\Forest\Controllers\ForestTitleController;
use App\Modules\Forest\Controllers\OperationalPlanController;
use App\Modules\Interoperability\Controllers\ImportBatchController;
use App\Modules\TraceGraph\Controllers\GraphSeedController;
use App\Modules\TraceGraph\Controllers\TraceEdgeController;
use App\Modules\TraceGraph\Controllers\TraceNodeController;
use Illuminate\Support\Facades\Route;

// Salud del servicio (S1-BE-01).
Route::get('/health', HealthController::class);

// Endpoints base de consulta del Sprint 1 (S1-BE-08). Solo lectura, sin auth.
Route::get('/source-systems', SourceSystemController::class);
Route::get('/forest-titles', ForestTitleController::class);
Route::get('/operational-plans', OperationalPlanController::class);
Route::get('/cutting-parcels', CuttingParcelController::class);
Route::get('/census-trees', CensusTreeController::class);

// Grafo de evidencia.
Route::get('/trace/nodes', TraceNodeController::class);
Route::get('/trace/edges', TraceEdgeController::class);
Route::get('/graph/seed', GraphSeedController::class);

// Conector interoperable (Sprint 2). Registro manual de lotes de importacion.
Route::post('/import-batches', [ImportBatchController::class, 'store']);
