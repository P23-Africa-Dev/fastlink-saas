<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\DailyTasksRequest;
use App\Http\Requests\Dashboard\PipelineStatsRequest;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService) {}

    public function stats(Request $request): JsonResponse
    {
        return $this->success($this->dashboardService->stats($request->user()), 'Dashboard stats fetched.');
    }

    public function pipelineStats(PipelineStatsRequest $request): JsonResponse
    {
        return $this->success(
            $this->dashboardService->pipelineStats(
                $request->filled('state_id') ? (int) $request->input('state_id') : null,
                $request->string('status')->toString() ?: null,
                $request->filled('drive_id') ? (int) $request->input('drive_id') : null,
                $request->user(),
            ),
            'Dashboard pipeline stats fetched.'
        );
    }

    public function dailyTasks(DailyTasksRequest $request): JsonResponse
    {
        return $this->success(
            $this->dashboardService->dailyTasks(
                $request->user(),
                $request->string('date')->toString() ?: null,
                $request->string('status')->toString() ?: null,
                (int) $request->integer('limit', 50),
            ),
            'Dashboard daily tasks fetched.'
        );
    }
}
