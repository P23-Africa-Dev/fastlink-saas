<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeadStatus\StoreLeadStatusRequest;
use App\Http\Requests\LeadStatus\UpdateLeadStatusRequest;
use App\Models\LeadStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadStatusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $statuses = LeadStatus::query()
            ->ordered()
            ->when($request->boolean('with_counts'), fn ($query) => $query->withCount('leads'))
            ->paginate((int) $request->integer('per_page', 20));

        return $this->paginated($statuses, $statuses->items(), 'Lead statuses fetched.');
    }

    public function store(StoreLeadStatusRequest $request): JsonResponse
    {
        $payload = $request->validated();

        if (($payload['is_default'] ?? false) === true) {
            LeadStatus::query()->update(['is_default' => false]);
        }

        $status = LeadStatus::create($payload);

        return $this->success($status, 'Lead status created.', 201);
    }

    public function show(LeadStatus $status): JsonResponse
    {
        return $this->success($status->loadCount('leads'), 'Lead status fetched.');
    }

    public function update(UpdateLeadStatusRequest $request, LeadStatus $status): JsonResponse
    {
        $payload = $request->validated();

        if (($payload['is_default'] ?? false) === true) {
            LeadStatus::whereKeyNot($status->id)->update(['is_default' => false]);
        }

        $status->update($payload);

        return $this->success($status->fresh(), 'Lead status updated.');
    }

    public function destroy(LeadStatus $status): JsonResponse
    {
        $status->delete();

        return $this->success(null, 'Lead status deleted.');
    }
}
