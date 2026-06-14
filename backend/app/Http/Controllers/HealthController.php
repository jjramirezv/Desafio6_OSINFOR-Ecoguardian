<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /**
     * Health check endpoint to verify the API is running.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'Huella Legal Forestal API',
            'version' => '0.1.0',
            'environment' => app()->environment(),
        ]);
    }
}
