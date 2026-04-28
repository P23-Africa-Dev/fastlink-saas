<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * API health check — returns system status.
     * Used by monitoring tools and deployment pipelines.
     */
    public function check(): JsonResponse
    {
        $checks = [];
        $status = 'ok';

        // Database connectivity check
        try {
            DB::connection()->getPdo();
            $checks['database'] = [
                'status' => 'ok',
                'driver' => config('database.default'),
            ];
        } catch (\Exception $e) {
            $status = 'degraded';
            $checks['database'] = [
                'status' => 'error',
                'message' => 'Database unreachable',
            ];
        }

        // Application environment check
        $checks['app'] = [
            'status' => 'ok',
            'name'    => config('app.name'),
            'env'     => config('app.env'),
            'debug'   => config('app.debug'),
        ];

        $httpStatus = $status === 'ok' ? 200 : 503;

        return response()->json([
            'status'    => $status,
            'timestamp' => now()->toIso8601String(),
            'version'   => config('app.version', '1.0.0'),
            'checks'    => $checks,
        ], $httpStatus);
    }
}
