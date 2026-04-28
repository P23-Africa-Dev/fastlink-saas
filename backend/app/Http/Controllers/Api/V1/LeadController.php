<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\ImportLeadRequest;
use App\Http\Requests\Lead\StoreLeadActivityRequest;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Services\Crm\LeadImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function __construct(private readonly LeadImportService $leadImportService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Lead::query()
            ->with(['assignedUser:id,name,email', 'creator:id,name,email', 'drive:id,name,color', 'statusDefinition:id,name,color'])
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

        return $this->success(
            $lead->load(['assignedUser:id,name,email', 'drive:id,name,color', 'statusDefinition:id,name,color']),
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
            ]),
            'Lead fetched.'
        );
    }

    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $payload = $request->validated();

        $oldStatus = $lead->status;
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

        return $this->success(
            $lead->fresh()->load(['assignedUser:id,name,email', 'drive:id,name,color', 'statusDefinition:id,name,color']),
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

        return $this->success($result, 'Lead import completed.');
    }
}
