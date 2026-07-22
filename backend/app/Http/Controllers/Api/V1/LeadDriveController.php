<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeadDrive\StoreLeadDriveRequest;
use App\Http\Requests\LeadDrive\UpdateLeadDriveRequest;
use App\Models\LeadDrive;
use App\Services\Crm\LeadDriveVisibility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadDriveController extends Controller
{
    public function __construct(
        private readonly LeadDriveVisibility $visibility,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $drives = LeadDrive::query()
            ->visibleTo($user)
            ->when($request->boolean('with_counts'), fn ($query) => $query->withCount('leads'))
            ->orderBy('position')
            ->orderBy('id')
            ->paginate((int) $request->integer('per_page', 20));

        $items = collect($drives->items())->map(function (LeadDrive $drive) use ($user) {
            return $this->presentDrive($drive, $user);
        })->all();

        return $this->paginated($drives, $items, 'Lead drives fetched.');
    }

    public function store(StoreLeadDriveRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! $this->visibility->canCreate($user)) {
            return $this->error('You are not allowed to create pipelines.', 403);
        }

        $payload = $request->validated();
        $isPrivate = array_key_exists('is_private', $payload) ? (bool) $payload['is_private'] : null;
        unset($payload['is_private']);

        $privacy = $this->visibility->resolvePrivacyOnCreate($user, $isPrivate);

        if (($payload['is_default'] ?? false) === true) {
            if ($privacy['is_private']) {
                return $this->error('Private pipelines cannot be set as the company default.', 422);
            }
            LeadDrive::query()->update(['is_default' => false]);
        }

        $drive = LeadDrive::create([
            ...$payload,
            ...$privacy,
            'created_by' => $user->id,
        ]);

        return $this->success($this->presentDrive($drive, $user), 'Lead drive created.', 201);
    }

    public function show(Request $request, LeadDrive $drive): JsonResponse
    {
        $user = $request->user();

        if (! $this->visibility->canView($user, $drive)) {
            return $this->error('Lead drive not found.', 404);
        }

        $drive->loadCount('leads');

        return $this->success($this->presentDrive($drive, $user), 'Lead drive fetched.');
    }

    public function update(UpdateLeadDriveRequest $request, LeadDrive $drive): JsonResponse
    {
        $user = $request->user();

        if (! $this->visibility->canManage($user, $drive)) {
            return $this->error('You are not allowed to update this pipeline.', 403);
        }

        $payload = $request->validated();
        $isPrivate = array_key_exists('is_private', $payload) ? (bool) $payload['is_private'] : null;
        unset($payload['is_private']);

        $privacy = $this->visibility->resolvePrivacyOnUpdate($user, $drive, $isPrivate);
        $willBePrivate = array_key_exists('is_private', $privacy)
            ? $privacy['is_private']
            : (bool) $drive->is_private;

        if (($payload['is_default'] ?? false) === true) {
            if ($willBePrivate) {
                return $this->error('Private pipelines cannot be set as the company default.', 422);
            }
            LeadDrive::whereKeyNot($drive->id)->update(['is_default' => false]);
        }

        $drive->update([
            ...$payload,
            ...$privacy,
        ]);

        return $this->success($this->presentDrive($drive->fresh(), $user), 'Lead drive updated.');
    }

    public function destroy(Request $request, LeadDrive $drive): JsonResponse
    {
        $user = $request->user();

        if (! $this->visibility->canManage($user, $drive)) {
            return $this->error('You are not allowed to delete this pipeline.', 403);
        }

        $drive->delete();

        return $this->success(null, 'Lead drive deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function presentDrive(LeadDrive $drive, $user): array
    {
        return [
            ...$drive->toArray(),
            ...$this->visibility->abilityFlags($user, $drive),
        ];
    }
}
