<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadDrive;
use App\Models\LeadStatus;
use App\Models\User;
use App\Services\Crm\LeadDriveVisibility;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class LeadMetricsService
{
    public function __construct(
        private readonly LeadDriveVisibility $driveVisibility,
    ) {}

    public function total(?User $viewer = null): int
    {
        return $this->baseQuery($viewer)->count();
    }

    public function createdThisWeek(?User $viewer = null): int
    {
        $now = Carbon::now(config('app.timezone'));
        $startOfWeek = $now->copy()->startOfWeek();

        return $this->baseQuery($viewer)
            ->whereBetween('created_at', [$startOfWeek, $now])
            ->count();
    }

    public function countByStatus(string $status, ?User $viewer = null): int
    {
        return $this->baseQuery($viewer)
            ->whereRaw('LOWER(status) = ?', [Str::lower($status)])
            ->count();
    }

    public function pipelineValue(?User $viewer = null): float
    {
        return (float) $this->baseQuery($viewer)
            ->whereNotNull('estimated_value')
            ->sum('estimated_value');
    }

    public function pipelineStats(?int $stateId = null, ?string $status = null, ?int $driveId = null, ?User $viewer = null): array
    {
        if ($driveId && $viewer) {
            $driveModel = LeadDrive::query()->find($driveId);
            if (! $driveModel || ! $this->driveVisibility->canView($viewer, $driveModel)) {
                return [
                    'total_leads' => 0,
                    'drive' => null,
                    'filters' => [
                        'drive_id' => $driveId,
                        'state_id' => $stateId,
                        'status' => $status,
                        'resolved_status' => $this->resolveStatusFilter($status),
                    ],
                    'top_states' => [],
                    'top_entries' => [],
                ];
            }
        }

        $resolvedStatus = $this->resolveStatusFilter($status);

        $baseQuery = $this->baseQuery($viewer)
            ->when($stateId, fn (Builder $query) => $query->where('state_id', $stateId))
            ->when($driveId, fn (Builder $query) => $query->where('drive_id', $driveId));

        $baseQuery = $this->applyStatusFilter($baseQuery, $resolvedStatus);

        $drive = $driveId
            ? LeadDrive::query()->find($driveId, ['id', 'name', 'color', 'slug'])
            : null;

        $totalLeads = (clone $baseQuery)->count();

        $locatedQuery = (clone $baseQuery)
            ->whereNotNull('leads.country_id')
            ->whereNotNull('leads.state_id');

        $topStates = (clone $locatedQuery)
            ->join('states', 'states.id', '=', 'leads.state_id')
            ->selectRaw('states.id as state_id, states.name as state_name, COUNT(*) as lead_count')
            ->groupBy('states.id', 'states.name')
            ->orderByDesc('lead_count')
            ->limit(3)
            ->get()
            ->map(fn ($row): array => [
                'state_id' => (int) $row->state_id,
                'state' => (string) $row->state_name,
                'lead_count' => (int) $row->lead_count,
            ])
            ->values()
            ->all();

        $topEntries = (clone $locatedQuery)
            ->with(['state:id,name'])
            ->select(['id', 'first_name', 'last_name', 'company', 'status', 'state_id', 'created_at'])
            ->orderByDesc('id')
            ->limit(3)
            ->get()
            ->map(function (Lead $lead): array {
                $fullName = trim(($lead->first_name ?? '') . ' ' . ($lead->last_name ?? ''));
                $name = $fullName !== '' ? $fullName : ((string) ($lead->company ?? 'Lead #' . $lead->id));

                return [
                    'id' => $lead->id,
                    'name' => $name,
                    'status' => (string) $lead->status,
                    'state' => $lead->state?->name,
                    'created_at' => optional($lead->created_at)?->toISOString(),
                ];
            })
            ->values()
            ->all();

        return [
            'total_leads' => $totalLeads,
            'drive' => $drive ? [
                'id' => (int) $drive->id,
                'name' => (string) $drive->name,
                'color' => (string) $drive->color,
                'slug' => (string) $drive->slug,
            ] : null,
            'filters' => [
                'drive_id' => $driveId,
                'state_id' => $stateId,
                'status' => $status,
                'resolved_status' => $resolvedStatus,
            ],
            'top_states' => $topStates,
            'top_entries' => $topEntries,
        ];
    }

    public function baseQuery(?User $viewer = null): Builder
    {
        $query = Lead::query();

        if ($viewer) {
            $query->visibleTo($viewer);
        }

        return $query;
    }

    /**
     * @return array{type: 'status'|'status_id'|null, value: string|int|null}
     */
    private function resolveStatusFilter(?string $status): array
    {
        $value = trim((string) $status);
        if ($value === '') {
            return ['type' => null, 'value' => null];
        }

        $normalized = Str::lower($value);

        $statusRow = LeadStatus::query()
            ->whereRaw('LOWER(name) = ?', [$normalized])
            ->orWhereRaw('LOWER(slug) = ?', [Str::slug($normalized)])
            ->first(['id', 'slug']);

        if ($statusRow !== null) {
            return ['type' => 'status_id', 'value' => (int) $statusRow->id];
        }

        return ['type' => 'status', 'value' => $normalized];
    }

    /**
     * @param  array{type: 'status'|'status_id'|null, value: string|int|null}  $resolvedStatus
     */
    private function applyStatusFilter(Builder $query, array $resolvedStatus): Builder
    {
        if ($resolvedStatus['type'] === 'status_id' && is_int($resolvedStatus['value'])) {
            return $query->where('status_id', $resolvedStatus['value']);
        }

        if ($resolvedStatus['type'] === 'status' && is_string($resolvedStatus['value'])) {
            return $query->whereRaw('LOWER(status) = ?', [$resolvedStatus['value']]);
        }

        return $query;
    }
}
