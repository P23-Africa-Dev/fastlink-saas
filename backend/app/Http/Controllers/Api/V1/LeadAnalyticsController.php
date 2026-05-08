<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\LeadAnalyticsRequest;
use App\Services\Crm\LeadAnalyticsService;
use Illuminate\Http\JsonResponse;

class LeadAnalyticsController extends Controller
{
    public function __construct(private readonly LeadAnalyticsService $leadAnalyticsService) {}

    public function index(LeadAnalyticsRequest $request): JsonResponse
    {
        return $this->success(
            $this->leadAnalyticsService->statistics($request->validated()),
            'Lead analytics fetched.'
        );
    }

    public function timeline(LeadAnalyticsRequest $request): JsonResponse
    {
        $timeline = $this->leadAnalyticsService->timeline($request->validated());

        return $this->paginated($timeline, $timeline->items(), 'Lead activity timeline fetched.');
    }

    public function topUploaders(LeadAnalyticsRequest $request): JsonResponse
    {
        return $this->success(
            $this->leadAnalyticsService->topUploaders($request->validated()),
            'Top uploaders fetched.'
        );
    }
}
