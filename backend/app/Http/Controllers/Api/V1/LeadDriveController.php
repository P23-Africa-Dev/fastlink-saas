<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeadDrive\StoreLeadDriveRequest;
use App\Http\Requests\LeadDrive\UpdateLeadDriveRequest;
use App\Models\LeadDrive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadDriveController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $drives = LeadDrive::query()
            ->when($request->boolean('with_counts'), fn ($query) => $query->withCount('leads'))
            ->orderBy('position')
            ->orderBy('id')
            ->paginate((int) $request->integer('per_page', 20));

        return $this->paginated($drives, $drives->items(), 'Lead drives fetched.');
    }

    public function store(StoreLeadDriveRequest $request): JsonResponse
    {
        $payload = $request->validated();

        if (($payload['is_default'] ?? false) === true) {
            LeadDrive::query()->update(['is_default' => false]);
        }

        $drive = LeadDrive::create($payload);

        return $this->success($drive, 'Lead drive created.', 201);
    }

    public function show(LeadDrive $drive): JsonResponse
    {
        return $this->success($drive->loadCount('leads'), 'Lead drive fetched.');
    }

    public function update(UpdateLeadDriveRequest $request, LeadDrive $drive): JsonResponse
    {
        $payload = $request->validated();

        if (($payload['is_default'] ?? false) === true) {
            LeadDrive::whereKeyNot($drive->id)->update(['is_default' => false]);
        }

        $drive->update($payload);

        return $this->success($drive->fresh(), 'Lead drive updated.');
    }

    public function destroy(LeadDrive $drive): JsonResponse
    {
        $drive->delete();

        return $this->success(null, 'Lead drive deleted.');
    }
}
