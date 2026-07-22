<?php

namespace App\Services\Crm;

use App\Models\Lead;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class LeadAnalyticsService
{
    private const IMPORTED_CONDITION = "(leads.imported_by IS NOT NULL OR LOWER(COALESCE(leads.source_type, '')) = 'import' OR LOWER(COALESCE(leads.source, '')) = 'import')";

    private const MANUAL_CONDITION = "(leads.imported_by IS NULL AND LOWER(COALESCE(leads.source_type, '')) <> 'import' AND LOWER(COALESCE(leads.source, '')) <> 'import')";

    private const IMPORTED_OWNER = 'COALESCE(leads.imported_by, leads.created_by)';

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function statistics(array $input, ?User $viewer = null): array
    {
        $filters = $this->normalizeFilters($input, $viewer);
        $grouped = $this->groupedUserStats($filters);

        $manualTotal = (int) collect($grouped['users'])->sum('manual_leads') + $grouped['unattributed']['manual'];
        $importedTotal = (int) collect($grouped['users'])->sum('imported_leads') + $grouped['unattributed']['imported'];

        $items = collect($grouped['users'])
            ->sortByDesc('total_leads')
            ->values()
            ->all();

        $filteredQuery = $this->applyUserFilter(
            $this->applyTypeFilter($this->baseQuery($filters), $filters['type']),
            $filters['user_id'],
            $filters['type']
        );

        $lastActivity = (clone $filteredQuery)->max('created_at');

        return [
            'summary' => [
                'manual_leads' => $manualTotal,
                'imported_leads' => $importedTotal,
                'total_leads' => $manualTotal + $importedTotal,
                'last_activity' => $lastActivity ? Carbon::parse((string) $lastActivity)->toDateTimeString() : null,
                'unattributed' => $grouped['unattributed'],
            ],
            'filters' => $this->publicFilters($filters),
            'user_stats' => $items,
            'top_uploaders' => array_slice($items, 0, min(5, count($items))),
            'trend' => $this->trend($filters),
            'period_summaries' => $this->periodSummaries($filters),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function timeline(array $input, ?User $viewer = null): LengthAwarePaginator
    {
        $filters = $this->normalizeFilters($input, $viewer);
        $perPage = max(1, min((int) ($filters['per_page'] ?? 20), 200));

        $query = $this->applyUserFilter(
            $this->applyTypeFilter($this->baseQuery($filters), $filters['type']),
            $filters['user_id'],
            $filters['type']
        )
            ->with([
                'creator:id,name,email',
                'importer:id,name,email',
                'drive:id,name,color,slug',
                'country:id,name,code',
                'state:id,name',
                'lga:id,name',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $paginator = $query->paginate($perPage);

        $paginator->setCollection(
            $paginator->getCollection()->map(function (Lead $lead): array {
                $isImported = $this->isImported($lead);
                $actor = $isImported ? ($lead->importer ?? $lead->creator) : $lead->creator;

                $fullName = trim((string) $lead->first_name . ' ' . (string) $lead->last_name);
                $leadName = $fullName !== '' ? $fullName : ((string) ($lead->company ?: 'Lead #' . $lead->id));
                $action = $isImported ? "Imported lead {$leadName}" : "Created lead {$leadName}";

                return [
                    'lead_id' => $lead->id,
                    'user' => $actor ? [
                        'id' => $actor->id,
                        'name' => $actor->name,
                        'email' => $actor->email,
                    ] : null,
                    'action_type' => $isImported ? 'imported' : 'manual',
                    'action' => $action,
                    'timestamp' => optional($lead->created_at)?->toDateTimeString(),
                    'drive' => $lead->drive ? [
                        'id' => $lead->drive->id,
                        'name' => $lead->drive->name,
                        'color' => $lead->drive->color,
                        'slug' => $lead->drive->slug,
                    ] : null,
                    'location' => [
                        'country_id' => $lead->country_id,
                        'country' => $lead->country?->name,
                        'state_id' => $lead->state_id,
                        'state' => $lead->state?->name,
                        'lga_id' => $lead->lga_id,
                        'lga' => $lead->lga?->name,
                    ],
                ];
            })
        );

        return $paginator;
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function topUploaders(array $input, ?User $viewer = null): array
    {
        $filters = $this->normalizeFilters($input, $viewer);
        $limit = max(1, min((int) ($filters['limit'] ?? 10), 50));

        $grouped = $this->groupedUserStats($filters);
        $items = collect($grouped['users'])
            ->sortByDesc('total_leads')
            ->values()
            ->take($limit)
            ->all();

        return [
            'filters' => $this->publicFilters($filters),
            'items' => $items,
            'total_uploaded_today' => $this->countWithinRange($filters, Carbon::today(), Carbon::now()),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function groupedUserStats(array $filters): array
    {
        $manualRows = collect();
        if ($filters['type'] !== 'imported') {
            $manualRows = $this->manualByUser($filters);
        }

        $importedRows = collect();
        if ($filters['type'] !== 'manual') {
            $importedRows = $this->importedByUser($filters);
        }

        /** @var array<int, array<string, mixed>> $indexed */
        $indexed = [];

        foreach ($manualRows as $row) {
            $ownerId = (int) $row->owner_id;
            $indexed[$ownerId] = [
                'user_id' => $ownerId,
                'manual_leads' => (int) $row->manual_leads,
                'imported_leads' => 0,
                'last_activity' => $row->last_activity,
            ];
        }

        foreach ($importedRows as $row) {
            $ownerId = (int) $row->owner_id;
            if (!isset($indexed[$ownerId])) {
                $indexed[$ownerId] = [
                    'user_id' => $ownerId,
                    'manual_leads' => 0,
                    'imported_leads' => 0,
                    'last_activity' => null,
                ];
            }

            $indexed[$ownerId]['imported_leads'] = (int) $row->imported_leads;
            $indexed[$ownerId]['last_activity'] = $this->maxDateTime(
                $indexed[$ownerId]['last_activity'],
                $row->last_activity
            );
        }

        if ($filters['user_id'] !== null && !isset($indexed[$filters['user_id']])) {
            $indexed[$filters['user_id']] = [
                'user_id' => $filters['user_id'],
                'manual_leads' => 0,
                'imported_leads' => 0,
                'last_activity' => null,
            ];
        }

        $userIds = array_map('intval', array_keys($indexed));

        $users = User::query()
            ->withTrashed()
            ->whereIn('id', $userIds)
            ->get(['id', 'name', 'email', 'deleted_at'])
            ->keyBy('id');

        $items = collect($indexed)
            ->map(function (array $row) use ($users): array {
                $manual = (int) ($row['manual_leads'] ?? 0);
                $imported = (int) ($row['imported_leads'] ?? 0);
                $user = $users->get((int) $row['user_id']);

                return [
                    'user' => [
                        'id' => (int) $row['user_id'],
                        'name' => $user?->name ?? 'Deleted User',
                        'email' => $user?->email,
                    ],
                    'manual_leads' => $manual,
                    'imported_leads' => $imported,
                    'total_leads' => $manual + $imported,
                    'last_activity' => $row['last_activity']
                        ? Carbon::parse((string) $row['last_activity'])->toDateTimeString()
                        : null,
                ];
            })
            ->sortByDesc('total_leads')
            ->values()
            ->all();

        return [
            'users' => $items,
            'unattributed' => [
                'manual' => $filters['type'] === 'imported' ? 0 : $this->manualUnattributedCount($filters),
                'imported' => $filters['type'] === 'manual' ? 0 : $this->importedUnattributedCount($filters),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function baseQuery(array $filters): Builder
    {
        return Lead::query()
            ->when(
                ($filters['viewer'] ?? null) instanceof User,
                fn (Builder $q) => $q->visibleTo($filters['viewer'])
            )
            ->when($filters['drive_id'], fn(Builder $q) => $q->where('drive_id', (int) $filters['drive_id']))
            ->when($filters['country_id'], fn(Builder $q) => $q->where('country_id', (int) $filters['country_id']))
            ->when($filters['state_id'], fn(Builder $q) => $q->where('state_id', (int) $filters['state_id']))
            ->when($filters['lga_id'], fn(Builder $q) => $q->where('lga_id', (int) $filters['lga_id']))
            ->when($filters['date_start'] && $filters['date_end'], function (Builder $q) use ($filters) {
                $q->whereBetween('created_at', [$filters['date_start'], $filters['date_end']]);
            });
    }

    private function applyTypeFilter(Builder $query, string $type): Builder
    {
        if ($type === 'manual') {
            return $query->whereRaw(self::MANUAL_CONDITION);
        }

        if ($type === 'imported') {
            return $query->whereRaw(self::IMPORTED_CONDITION);
        }

        return $query->where(function (Builder $sub) {
            $sub->whereRaw(self::MANUAL_CONDITION)
                ->orWhereRaw(self::IMPORTED_CONDITION);
        });
    }

    private function applyUserFilter(Builder $query, ?int $userId, string $type): Builder
    {
        if ($userId === null) {
            return $query;
        }

        if ($type === 'manual') {
            return $query->where('created_by', $userId);
        }

        if ($type === 'imported') {
            return $query->whereRaw(self::IMPORTED_OWNER . ' = ?', [$userId]);
        }

        return $query->where(function (Builder $nested) use ($userId) {
            $nested
                ->where(function (Builder $q) use ($userId) {
                    $q->whereRaw(self::MANUAL_CONDITION)
                        ->where('created_by', $userId);
                })
                ->orWhere(function (Builder $q) use ($userId) {
                    $q->whereRaw(self::IMPORTED_CONDITION)
                        ->whereRaw(self::IMPORTED_OWNER . ' = ?', [$userId]);
                });
        });
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function manualByUser(array $filters): Collection
    {
        $query = $this->baseQuery($filters)
            ->whereRaw(self::MANUAL_CONDITION)
            ->whereNotNull('created_by');

        if ($filters['user_id'] !== null) {
            $query->where('created_by', (int) $filters['user_id']);
        }

        return $query
            ->selectRaw('created_by as owner_id, COUNT(*) as manual_leads, MAX(created_at) as last_activity')
            ->groupBy('created_by')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function importedByUser(array $filters): Collection
    {
        $query = $this->baseQuery($filters)
            ->whereRaw(self::IMPORTED_CONDITION)
            ->whereRaw(self::IMPORTED_OWNER . ' IS NOT NULL');

        if ($filters['user_id'] !== null) {
            $query->whereRaw(self::IMPORTED_OWNER . ' = ?', [(int) $filters['user_id']]);
        }

        return $query
            ->selectRaw(self::IMPORTED_OWNER . ' as owner_id, COUNT(*) as imported_leads, MAX(created_at) as last_activity')
            ->groupByRaw(self::IMPORTED_OWNER)
            ->get();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function manualUnattributedCount(array $filters): int
    {
        return $this->baseQuery($filters)
            ->whereRaw(self::MANUAL_CONDITION)
            ->whereNull('created_by')
            ->count();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function importedUnattributedCount(array $filters): int
    {
        return $this->baseQuery($filters)
            ->whereRaw(self::IMPORTED_CONDITION)
            ->whereRaw(self::IMPORTED_OWNER . ' IS NULL')
            ->count();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function trend(array $filters): array
    {
        $manualRows = collect();
        if ($filters['type'] !== 'imported') {
            $manualRows = $this->applyUserFilter(
                $this->baseQuery($filters)->whereRaw(self::MANUAL_CONDITION),
                $filters['user_id'],
                'manual'
            )
                ->selectRaw('DATE(created_at) as activity_date, COUNT(*) as total')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('activity_date')
                ->get();
        }

        $importedRows = collect();
        if ($filters['type'] !== 'manual') {
            $importedRows = $this->applyUserFilter(
                $this->baseQuery($filters)->whereRaw(self::IMPORTED_CONDITION),
                $filters['user_id'],
                'imported'
            )
                ->selectRaw('DATE(created_at) as activity_date, COUNT(*) as total')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('activity_date')
                ->get();
        }

        /** @var array<string, array{manual_leads: int, imported_leads: int}> $bucket */
        $bucket = [];

        foreach ($manualRows as $row) {
            $date = (string) $row->activity_date;
            $bucket[$date] = [
                'manual_leads' => (int) $row->total,
                'imported_leads' => $bucket[$date]['imported_leads'] ?? 0,
            ];
        }

        foreach ($importedRows as $row) {
            $date = (string) $row->activity_date;
            $bucket[$date] = [
                'manual_leads' => $bucket[$date]['manual_leads'] ?? 0,
                'imported_leads' => (int) $row->total,
            ];
        }

        ksort($bucket);

        $points = [];
        foreach ($bucket as $date => $counts) {
            $total = $counts['manual_leads'] + $counts['imported_leads'];
            $points[] = [
                'date' => $date,
                'manual_leads' => $counts['manual_leads'],
                'imported_leads' => $counts['imported_leads'],
                'total_leads' => $total,
            ];
        }

        return [
            'granularity' => 'day',
            'points' => $points,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function periodSummaries(array $filters): array
    {
        return [
            'today' => $this->countWithinRange($filters, Carbon::today(), Carbon::now()),
            'this_week' => $this->countWithinRange($filters, Carbon::now()->startOfWeek(), Carbon::now()),
            'this_month' => $this->countWithinRange($filters, Carbon::now()->startOfMonth(), Carbon::now()),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function countWithinRange(array $filters, Carbon $from, Carbon $to): int
    {
        $rangeFilters = $filters;
        $rangeFilters['date_start'] = $from;
        $rangeFilters['date_end'] = $to;

        $query = $this->applyUserFilter(
            $this->applyTypeFilter($this->baseQuery($rangeFilters), $rangeFilters['type']),
            $rangeFilters['user_id'],
            $rangeFilters['type']
        );

        return $query->count();
    }

    private function isImported(Lead $lead): bool
    {
        if ($lead->imported_by !== null) {
            return true;
        }

        return strtolower((string) $lead->source_type) === 'import'
            || strtolower((string) $lead->source) === 'import';
    }

    private function maxDateTime(mixed $left, mixed $right): mixed
    {
        if ($left === null) {
            return $right;
        }

        if ($right === null) {
            return $left;
        }

        return Carbon::parse((string) $left)->greaterThan(Carbon::parse((string) $right)) ? $left : $right;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function publicFilters(array $filters): array
    {
        return [
            'user_id' => $filters['user_id'],
            'type' => $filters['type'],
            'period' => $filters['period'],
            'start_date' => $filters['date_start'] ? $filters['date_start']->toDateString() : null,
            'end_date' => $filters['date_end'] ? $filters['date_end']->toDateString() : null,
            'drive_id' => $filters['drive_id'],
            'country_id' => $filters['country_id'],
            'state_id' => $filters['state_id'],
            'lga_id' => $filters['lga_id'],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function normalizeFilters(array $input, ?User $viewer = null): array
    {
        $period = (string) ($input['period'] ?? '');
        $type = (string) ($input['type'] ?? 'both');

        if (!in_array($type, ['manual', 'imported', 'both'], true)) {
            $type = 'both';
        }

        $startDateRaw = $input['start_date'] ?? null;
        $endDateRaw = $input['end_date'] ?? null;

        if (($startDateRaw || $endDateRaw) && $period === '') {
            $period = 'custom';
        }

        $dateStart = null;
        $dateEnd = null;

        if ($period === 'today') {
            $dateStart = Carbon::today();
            $dateEnd = Carbon::now();
        } elseif ($period === 'week') {
            $dateStart = Carbon::now()->startOfWeek();
            $dateEnd = Carbon::now();
        } elseif ($period === 'month') {
            $dateStart = Carbon::now()->startOfMonth();
            $dateEnd = Carbon::now();
        } elseif ($period === 'custom' && $startDateRaw && $endDateRaw) {
            $dateStart = Carbon::createFromFormat('Y-m-d', (string) $startDateRaw)->startOfDay();
            $dateEnd = Carbon::createFromFormat('Y-m-d', (string) $endDateRaw)->endOfDay();
        }

        return [
            'user_id' => isset($input['user_id']) ? (int) $input['user_id'] : null,
            'type' => $type,
            'period' => $period !== '' ? $period : null,
            'date_start' => $dateStart,
            'date_end' => $dateEnd,
            'drive_id' => isset($input['drive_id']) ? (int) $input['drive_id'] : null,
            'country_id' => isset($input['country_id']) ? (int) $input['country_id'] : null,
            'state_id' => isset($input['state_id']) ? (int) $input['state_id'] : null,
            'lga_id' => isset($input['lga_id']) ? (int) $input['lga_id'] : null,
            'per_page' => isset($input['per_page']) ? (int) $input['per_page'] : 20,
            'limit' => isset($input['limit']) ? (int) $input['limit'] : 10,
            'viewer' => $viewer,
        ];
    }
}
