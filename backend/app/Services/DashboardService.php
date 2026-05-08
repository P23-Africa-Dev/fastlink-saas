<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Project;
use App\Models\Spreadsheet;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class DashboardService
{
    public function __construct(private readonly LeadMetricsService $leadMetricsService) {}

    public function stats(): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $usersTotal = User::count();
        $usersActive = User::active()->count();

        $leadsTotal = $this->leadMetricsService->total();
        $leadsThisWeek = $this->leadMetricsService->createdThisWeek();
        $leadsNew = $this->leadMetricsService->countByStatus('new');
        $leadsWon = $this->leadMetricsService->countByStatus('won');
        $leadsLost = $this->leadMetricsService->countByStatus('lost');
        $pipelineValue = $this->leadMetricsService->pipelineValue();

        $projectsTotal = Project::count();
        $projectsActive = Project::where('status', 'in_progress')->count();

        $tasksTotal = Task::count();
        $tasksCompleted = Task::where('status', 'completed')->count();
        $tasksTodo = Task::whereIn('status', ['todo', 'in_progress', 'review'])->count();

        $attendanceToday = Attendance::whereDate('date', $today)->count();
        $leavePending = LeaveRequest::where('status', 'pending')->count();

        $spreadsheetsTotal = Spreadsheet::count();

        $conversionRate = $leadsTotal > 0 ? round(($leadsWon / $leadsTotal) * 100, 2) : 0.0;

        $monthlyLeads = $this->leadMetricsService->baseQuery()
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();
        $monthlyTasksCompleted = Task::where('status', 'completed')
            ->whereBetween('updated_at', [$monthStart, $monthEnd])
            ->count();

        return [
            'overview' => [
                'users_total' => $usersTotal,
                'users_active' => $usersActive,
                'leads_total' => $leadsTotal,
                'leads_this_week' => $leadsThisWeek,
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
                // Keep key name for frontend compatibility; value is weekly leads for the "Leads This Week" card.
                'new_leads' => $leadsThisWeek,
                'new_leads_monthly' => $monthlyLeads,
                'completed_tasks' => $monthlyTasksCompleted,
            ],
        ];
    }

    public function pipelineStats(?int $stateId = null, ?string $status = null, ?int $driveId = null): array
    {
        return $this->leadMetricsService->pipelineStats($stateId, $status, $driveId);
    }

    public function dailyTasks(User $user, ?string $date = null, ?string $status = null, int $limit = 50): array
    {
        $targetDate = $date
            ? Carbon::createFromFormat('Y-m-d', $date, config('app.timezone'))->startOfDay()
            : Carbon::today(config('app.timezone'));

        $query = Task::query()
            ->with([
                'creator:id,name,email',
                'assignees:id,name,email',
            ])
            ->whereDate('start_date', '<=', $targetDate->toDateString())
            ->whereDate('due_date', '>=', $targetDate->toDateString())
            ->when($status, fn(Builder $builder) => $builder->where('status', $status));

        if ($user->hasRole('staff') && ! $user->hasAnyRole(['admin', 'supervisor'])) {
            $query->where(function (Builder $builder) use ($user) {
                $builder->where('created_by', $user->id)
                    ->orWhereHas('assignees', fn(Builder $subQuery) => $subQuery->where('users.id', $user->id));
            });
        }

        $tasks = $query
            ->orderByRaw("CASE priority WHEN 'high' THEN 1 WHEN 'urgent' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
            ->orderBy('due_date')
            ->orderByDesc('id')
            ->limit(max(1, min($limit, 200)))
            ->get();

        return [
            'date' => $targetDate->toDateString(),
            'total_tasks' => $tasks->count(),
            'tasks' => $tasks->map(function (Task $task): array {
                $assignee = $task->assignees->first();

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'start_date' => optional($task->start_date)?->toDateString(),
                    'due_date' => optional($task->due_date)?->toDateString(),
                    'assigned_to' => $assignee ? [
                        'id' => $assignee->id,
                        'name' => $assignee->name,
                        'email' => $assignee->email,
                    ] : null,
                    'created_by' => $task->creator ? [
                        'id' => $task->creator->id,
                        'name' => $task->creator->name,
                        'email' => $task->creator->email,
                    ] : null,
                ];
            })->values()->all(),
        ];
    }
}
