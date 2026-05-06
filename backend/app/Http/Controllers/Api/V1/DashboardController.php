<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\PipelineStatsRequest;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService) {}

    public function stats(): JsonResponse
    {
        return $this->success($this->dashboardService->stats(), 'Dashboard stats fetched.');
    }

    public function pipelineStats(PipelineStatsRequest $request): JsonResponse
    {
        return $this->success(
            $this->dashboardService->pipelineStats(
                $request->filled('state_id') ? (int) $request->input('state_id') : null,
                $request->string('status')->toString() ?: null,
            ),
            'Dashboard pipeline stats fetched.'
        );
    }
}
