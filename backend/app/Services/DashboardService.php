<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Lead;
use App\Models\LeadStatus;
use App\Models\LeaveRequest;
use App\Models\Project;
use App\Models\Spreadsheet;
use App\Models\State;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class DashboardService
{
    public function stats(): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $usersTotal = User::count();
        $usersActive = User::active()->count();

        $leadsTotal = Lead::count();
        $leadsNew = Lead::where('status', 'new')->count();
        $leadsWon = Lead::where('status', 'won')->count();
        $leadsLost = Lead::where('status', 'lost')->count();
        $pipelineValue = (float) Lead::whereNotNull('estimated_value')->sum('estimated_value');

        $projectsTotal = Project::count();
        $projectsActive = Project::where('status', 'in_progress')->count();

        $tasksTotal = Task::count();
        $tasksCompleted = Task::where('status', 'completed')->count();
        $tasksTodo = Task::whereIn('status', ['todo', 'in_progress', 'review'])->count();

        $attendanceToday = Attendance::whereDate('date', $today)->count();
        $leavePending = LeaveRequest::where('status', 'pending')->count();

        $spreadsheetsTotal = Spreadsheet::count();

        $conversionRate = $leadsTotal > 0 ? round(($leadsWon / $leadsTotal) * 100, 2) : 0.0;

        $monthlyLeads = Lead::whereBetween('created_at', [$monthStart, $monthEnd])->count();
        $monthlyTasksCompleted = Task::where('status', 'completed')
            ->whereBetween('updated_at', [$monthStart, $monthEnd])
            ->count();

        return [
            'overview' => [
                'users_total' => $usersTotal,
                'users_active' => $usersActive,
                'leads_total' => $leadsTotal,
                'projects_total' => $projectsTotal,
                'tasks_total' => $tasksTotal,
                'attendance_today' => $attendanceToday,
                'leave_pending' => $leavePending,
                'spreadsheets_total' => $spreadsheetsTotal,
            ],
            'crm' => [
                'new' => $leadsNew,
                'won' => $leadsWon,
                'lost' => $leadsLost,
                'pipeline_value' => $pipelineValue,
                'conversion_rate' => $conversionRate,
            ],
            'projects' => [
                'active' => $projectsActive,
                'completed_tasks' => $tasksCompleted,
                'pending_tasks' => $tasksTodo,
            ],
            'monthly' => [
                'new_leads' => $monthlyLeads,
                'completed_tasks' => $monthlyTasksCompleted,
            ],
        ];
    }

    public function pipelineStats(?int $stateId = null, ?string $status = null): array
    {
        $resolvedStatus = $this->resolveStatusFilter($status);

        $baseQuery = Lead::query()
            ->when($stateId, fn(Builder $query) => $query->where('state_id', $stateId));

        $baseQuery = $this->applyStatusFilter($baseQuery, $resolvedStatus);

        $totalLeads = (clone $baseQuery)->count();

        $topStates = (clone $baseQuery)
            ->join('states', 'states.id', '=', 'leads.state_id')
            ->selectRaw('states.id as state_id, states.name as state_name, COUNT(*) as lead_count')
            ->groupBy('states.id', 'states.name')
            ->orderByDesc('lead_count')
            ->limit(3)
            ->get()
            ->map(fn($row): array => [
                'state_id' => (int) $row->state_id,
                'state' => (string) $row->state_name,
                'lead_count' => (int) $row->lead_count,
            ])
            ->values()
            ->all();

        $topEntries = (clone $baseQuery)
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
            'filters' => [
                'state_id' => $stateId,
                'status' => $status,
                'resolved_status' => $resolvedStatus,
            ],
            'top_states' => $topStates,
            'top_entries' => $topEntries,
        ];
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
