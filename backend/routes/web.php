<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageController;

// Redirigir la raíz al dashboard
Route::redirect('/', '/dashboard');

// Rutas de las pantallas del Sprint 1
Route::get('/dashboard', [PageController::class, 'dashboard'])->name('dashboard');
Route::get('/conector', [PageController::class, 'conector'])->name('conector');
Route::get('/mapa-origen', [PageController::class, 'mapaOrigen'])->name('mapa-origen');
Route::get('/explorador', [PageController::class, 'explorador'])->name('explorador');
Route::get('/huellas', [PageController::class, 'huellas'])->name('huellas');
Route::get('/alertas', [PageController::class, 'alertas'])->name('alertas');
Route::get('/integridad', [PageController::class, 'integridad'])->name('integridad');