<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\ImportLeadRequest;
use App\Http\Requests\Lead\StoreLeadActivityRequest;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Services\ActivityLogService;
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
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Lead::query()
            ->with(['assignedUser:id,name,email', 'creator:id,name,email', 'drive:id,name,color', 'statusDefinition:id,name,color', 'country:id,name,code', 'state:id,name', 'lga:id,name'])
            ->when($request->string('q')->toString(), function ($builder, $q) {
                $builder->where(function ($inner) use ($q) {
                    $inner->where('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('company', 'like', "%{$q}%");
                });
            })
            ->when($request->filled('status'), fn ($builder) => $builder->where('status', $request->string('status')))
            ->when($request->filled('drive_id'), fn ($builder) => $builder->where('drive_id', (int) $request->input('drive_id')))
            ->when($request->filled('assigned_to'), fn ($builder) => $builder->where('assigned_to', (int) $request->input('assigned_to')))
            ->when($request->filled('priority'), fn ($builder) => $builder->where('priority', $request->string('priority')))
            ->when($request->filled('country_id'), fn ($builder) => $builder->where('country_id', (int) $request->input('country_id')))
            ->when($request->filled('state_id'), fn ($builder) => $builder->where('state_id', (int) $request->input('state_id')))
            ->when($request->filled('lga_id'), fn ($builder) => $builder->where('lga_id', (int) $request->input('lga_id')))
            ->orderByDesc('id');

        $leads = $query->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($leads, $leads->items(), 'Leads fetched.');
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['created_by'] = $request->user()->id;

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

    public function show(Lead $lead): JsonResponse
    {
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
        $payload = $request->validated();

        $oldStatus = $lead->status;
        $oldAssignedTo = (int) ($lead->assigned_to ?? 0);
        $lead->update($payload);

        if (array_key_exists('status', $payload) && $payload['status'] !== $oldStatus) {
            $lead->activities()->create([
                'user_id' => $request->user()->id,
                'type' => 'status_change',
                'title' => 'Lead status updated',
                'old_value' => (string) $oldStatus,
                'new_value' => (string) $payload['status'],
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

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();

        return $this->success(null, 'Lead deleted.');
    }

    public function activities(Lead $lead, Request $request): JsonResponse
    {
        $activities = $lead->activities()
            ->with('user:id,name,email')
            ->paginate((int) $request->integer('per_page', 20));

        return $this->paginated($activities, $activities->items(), 'Lead activities fetched.');
    }

    public function storeActivity(StoreLeadActivityRequest $request, Lead $lead): JsonResponse
    {
        $payload = $request->validated();
        $payload['user_id'] = $request->user()->id;

        $activity = $lead->activities()->create($payload);

        return $this->success($activity->load('user:id,name,email'), 'Lead activity created.', 201);
    }

    public function updateActivity(StoreLeadActivityRequest $request, LeadActivity $activity): JsonResponse
    {
        $activity->update($request->validated());

        return $this->success($activity->fresh()->load('user:id,name,email'), 'Lead activity updated.');
    }

    public function import(ImportLeadRequest $request): JsonResponse
    {
        $result = $this->leadImportService->import(
            $request->file('file'),
            $request->safe()->except(['file']),
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
}
