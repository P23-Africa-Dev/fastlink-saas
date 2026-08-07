<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\ImportLeadRequest;
use App\Http\Requests\Lead\StoreLeadActivityRequest;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\LeadDrive;
use App\Models\LeadStatus;
use App\Services\ActivityLogService;
use App\Services\Crm\LeadDriveVisibility;
use App\Services\Crm\LeadImportService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function __construct(
        private readonly LeadImportService $leadImportService,
        private readonly NotificationService $notificationService,
        private readonly ActivityLogService $activityLogService,
        private readonly LeadDriveVisibility $driveVisibility,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $user = $request->user();

        $query = Lead::query()
            ->visibleTo($user)
            ->with(['assignedUser:id,name,email', 'creator:id,name,email', 'drive:id,name,color', 'statusDefinition:id,name,color', 'country:id,name,code', 'state:id,name', 'lga:id,name'])
            ->when($request->string('q')->toString(), function ($builder, $q) {
                $builder->where(function ($inner) use ($q) {
                    $inner->where('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('company', 'like', "%{$q}%");
                });
            })
            ->when($request->filled('status'), fn($builder) => $builder->where('status', $request->string('status')))
            ->when($request->filled('status_id'), fn($builder) => $builder->where('status_id', (int) $request->input('status_id')))
            ->when($request->filled('drive_id'), fn($builder) => $builder->where('drive_id', (int) $request->input('drive_id')))
            ->when($request->filled('assigned_to'), fn($builder) => $builder->where('assigned_to', (int) $request->input('assigned_to')))
            ->when($request->filled('priority'), fn($builder) => $builder->where('priority', $request->string('priority')))
            ->when($request->filled('country_id'), fn($builder) => $builder->where('country_id', (int) $request->input('country_id')))
            ->when($request->filled('state_id'), fn($builder) => $builder->where('state_id', (int) $request->input('state_id')))
            ->orderByDesc('id');

        // Frontend CRM board requests per_page=300 and derives totals from returned array length.
        // Return full filtered dataset in this mode so CRM totals match dashboard totals.
        if ($perPage >= 300) {
            return $this->success($query->get(), 'Leads fetched.');
        }

        $leads = $query->paginate($perPage);

        return $this->paginated($leads, $leads->items(), 'Leads fetched.');
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $payload = $request->validated();

        if (! $this->assertDriveAccess($request, isset($payload['drive_id']) ? (int) $payload['drive_id'] : null)) {
            return $this->error('You cannot add leads to this pipeline.', 403);
        }

        $payload['created_by'] = $request->user()->id;
        $payload['imported_by'] = null;
        $payload['source_type'] = 'manual';
        $payload = $this->syncLeadStatusFields($payload);

        $lead = Lead::create($payload);

        $lead->activities()->create([
            'user_id' => $request->user()->id,
            'type' => 'note',
            'title' => 'Lead created',
            'description' => 'Lead was created via API.',
            'is_completed' => true,
        ]);

        $adminIds = $this->notificationService->roleUserIds('admin');
        $this->notificationService->notifyUsers(
            $adminIds,
            'crm.lead_created',
            'New lead created',
            "{$request->user()->name} created lead {$lead->first_name} {$lead->last_name}.",
            ['lead_id' => $lead->id],
            'medium',
            'crm.lead_created:' . $lead->id
        );

        if (! empty($lead->assigned_to)) {
            $this->notificationService->notifyUsers(
                $adminIds->push((int) $lead->assigned_to),
                'crm.lead_assigned',
                'Lead assigned',
                "Lead {$lead->first_name} {$lead->last_name} was assigned.",
                ['lead_id' => $lead->id, 'assigned_to' => (int) $lead->assigned_to],
                'medium',
                'crm.lead_assigned:' . $lead->id . ':' . (int) $lead->assigned_to
            );
        }

        $this->activityLogService->log(
            $request->user(),
            'crm.lead_created',
            "Lead #{$lead->id} created",
            ['lead_id' => $lead->id, 'assigned_to' => $lead->assigned_to]
        );

        return $this->success(
            $lead->load(['assignedUser:id,name,email', 'drive:id,name,color', 'statusDefinition:id,name,color', 'country:id,name,code', 'state:id,name', 'lga:id,name']),
            'Lead created.',
            201
        );
    }

    public function show(Request $request, Lead $lead): JsonResponse
    {
        if (! $this->assertLeadAccess($request, $lead)) {
            return $this->error('Lead not found.', 404);
        }

        return $this->success(
            $lead->load([
                'assignedUser:id,name,email',
                'creator:id,name,email',
                'drive:id,name,color',
                'statusDefinition:id,name,color',
                'activities.user:id,name,email',
                'country:id,name,code',
                'state:id,name',
                'lga:id,name',
            ]),
            'Lead fetched.'
        );
    }

    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        if (! $this->assertLeadAccess($request, $lead)) {
            return $this->error('Lead not found.', 404);
        }

        $payload = $request->validated();

        if (array_key_exists('drive_id', $payload)
            && ! $this->assertDriveAccess($request, $payload['drive_id'] !== null ? (int) $payload['drive_id'] : null)
        ) {
            return $this->error('You cannot move leads to this pipeline.', 403);
        }

        $payload = $this->syncLeadStatusFields($payload);

        $oldStatus = $lead->status;
        $oldStatusId = (int) ($lead->status_id ?? 0);
        $oldAssignedTo = (int) ($lead->assigned_to ?? 0);
        $lead->update($payload);

        $newStatus = (string) ($lead->status ?? '');
        $newStatusId = (int) ($lead->status_id ?? 0);
        $statusChanged = (array_key_exists('status', $payload) && $payload['status'] !== $oldStatus)
            || (array_key_exists('status_id', $payload) && $newStatusId !== $oldStatusId);

        if ($statusChanged) {
            $lead->activities()->create([
                'user_id' => $request->user()->id,
                'type' => 'status_change',
                'title' => 'Lead status updated',
                'old_value' => (string) $oldStatus,
                'new_value' => $newStatus !== '' ? $newStatus : (string) $newStatusId,
                'is_completed' => true,
            ]);
        }

        $newAssignedTo = (int) ($lead->assigned_to ?? 0);
        if (array_key_exists('assigned_to', $payload) && $newAssignedTo > 0 && $oldAssignedTo !== $newAssignedTo) {
            $adminIds = $this->notificationService->roleUserIds('admin');
            $this->notificationService->notifyUsers(
                $adminIds->push($newAssignedTo),
                'crm.lead_assigned',
                'Lead assigned',
                "Lead {$lead->first_name} {$lead->last_name} was assigned to a new owner.",
                ['lead_id' => $lead->id, 'assigned_to' => $newAssignedTo],
                'medium',
                'crm.lead_assigned:' . $lead->id . ':' . $newAssignedTo
            );

            $this->activityLogService->log(
                $request->user(),
                'crm.lead_assigned',
                "Lead #{$lead->id} assigned",
                ['lead_id' => $lead->id, 'old_assigned_to' => $oldAssignedTo ?: null, 'new_assigned_to' => $newAssignedTo]
            );
        }

        return $this->success(
            $lead->fresh()->load(['assignedUser:id,name,email', 'drive:id,name,color', 'statusDefinition:id,name,color', 'country:id,name,code', 'state:id,name', 'lga:id,name']),
            'Lead updated.'
        );
    }

    public function destroy(Request $request, Lead $lead): JsonResponse
    {
        if (! $this->assertLeadAccess($request, $lead)) {
            return $this->error('Lead not found.', 404);
        }

        $lead->delete();

        return $this->success(null, 'Lead deleted.');
    }

    public function activities(Lead $lead, Request $request): JsonResponse
    {
        if (! $this->assertLeadAccess($request, $lead)) {
            return $this->error('Lead not found.', 404);
        }

        $activities = $lead->activities()
            ->with('user:id,name,email')
            ->paginate((int) $request->integer('per_page', 20));

        return $this->paginated($activities, $activities->items(), 'Lead activities fetched.');
    }

    public function storeActivity(StoreLeadActivityRequest $request, Lead $lead): JsonResponse
    {
        if (! $this->assertLeadAccess($request, $lead)) {
            return $this->error('Lead not found.', 404);
        }

        $payload = $request->validated();
        $payload['user_id'] = $request->user()->id;

        $activity = $lead->activities()->create($payload);

        return $this->success($activity->load('user:id,name,email'), 'Lead activity created.', 201);
    }

    public function updateActivity(StoreLeadActivityRequest $request, LeadActivity $activity): JsonResponse
    {
        $activity->loadMissing('lead');

        if ($activity->lead && ! $this->assertLeadAccess($request, $activity->lead)) {
            return $this->error('Lead not found.', 404);
        }

        $activity->update($request->validated());

        return $this->success($activity->fresh()->load('user:id,name,email'), 'Lead activity updated.');
    }

    public function import(ImportLeadRequest $request): JsonResponse
    {
        $defaults = $request->safe()->except(['file']);
        $driveId = isset($defaults['drive_id']) ? (int) $defaults['drive_id'] : null;

        if (! $this->assertDriveAccess($request, $driveId)) {
            return $this->error('You cannot import leads into this pipeline.', 403);
        }

        $result = $this->leadImportService->import(
            $request->file('file'),
            $defaults,
            $request->user()
        );

        if (($result['imported'] ?? 0) > 0) {
            $adminIds = $this->notificationService->roleUserIds('admin');
            $this->notificationService->notifyUsers(
                $adminIds,
                'crm.lead_imported',
                'Bulk lead import completed',
                "{$request->user()->name} imported {$result['imported']} leads.",
                [
                    'imported' => $result['imported'],
                    'skipped' => $result['skipped'] ?? 0,
                    'errors' => $result['errors'] ?? [],
                    'device_recommended' => true,
                    'critical' => true,
                ],
                'high',
                'crm.lead_imported:' . md5((string) $request->user()->id . ':' . ($result['imported'] ?? 0) . ':' . ($result['skipped'] ?? 0))
            );
        }

        $this->activityLogService->log(
            $request->user(),
            'crm.lead_imported',
            'Bulk lead import executed',
            $result
        );

        return $this->success($result, 'Lead import completed.');
    }

    private function assertLeadAccess(Request $request, Lead $lead): bool
    {
        if ($lead->drive_id === null) {
            return true;
        }

        $drive = $lead->relationLoaded('drive') ? $lead->drive : $lead->drive()->first();

        if (! $drive instanceof LeadDrive) {
            return true;
        }

        return $this->driveVisibility->canView($request->user(), $drive);
    }

    private function assertDriveAccess(Request $request, ?int $driveId): bool
    {
        if ($driveId === null) {
            return true;
        }

        $drive = LeadDrive::query()->find($driveId);

        if (! $drive) {
            return false;
        }

        return $this->driveVisibility->canView($request->user(), $drive);
    }

    /**
     * Keep legacy string `status` and FK `status_id` aligned when either changes.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function syncLeadStatusFields(array $payload): array
    {
        $allowed = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

        if (array_key_exists('status_id', $payload) && $payload['status_id'] !== null && ! array_key_exists('status', $payload)) {
            $slug = LeadStatus::query()->whereKey((int) $payload['status_id'])->value('slug');
            if (is_string($slug) && in_array($slug, $allowed, true)) {
                $payload['status'] = $slug;
            }
        }

        if (array_key_exists('status', $payload) && is_string($payload['status']) && ! array_key_exists('status_id', $payload)) {
            $statusId = LeadStatus::query()->where('slug', $payload['status'])->value('id');
            if ($statusId) {
                $payload['status_id'] = (int) $statusId;
            }
        }

        return $payload;
    }
}
