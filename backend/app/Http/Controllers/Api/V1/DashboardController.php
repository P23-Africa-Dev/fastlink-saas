<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService)
    {
    }

    public function stats(): JsonResponse
    {
        return $this->success($this->dashboardService->stats(), 'Dashboard stats fetched.');
    }
}
