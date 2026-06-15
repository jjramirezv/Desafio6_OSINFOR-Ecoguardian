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
            'data' => [
                'status' => 'ok',
                'service' => 'Huella Legal Forestal API',
                'backend_status' => 'READY_FOR_DEMO',
            ],
        ]);
    }
}
