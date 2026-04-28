<?php

namespace App\Services;

use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class TaskBoardService
{
    public function kanban(?int $projectId = null): array
    {
        $statuses = ['todo', 'in_progress', 'review', 'completed'];

        $tasks = Task::query()
            ->with(['assignees:id,name,email', 'project:id,name'])
            ->when($projectId, fn (Builder $query) => $query->where('project_id', $projectId))
            ->orderBy('order')
            ->get();

        $grouped = [];

        foreach ($statuses as $status) {
            $grouped[$status] = $tasks->where('status', $status)->values();
        }

        return $grouped;
    }

    public function gantt(?Carbon $from = null, ?Carbon $to = null): array
    {
        return Task::query()
            ->with('project:id,name')
            ->when($from, fn (Builder $query) => $query->whereDate('due_date', '>=', $from->toDateString()))
            ->when($to, fn (Builder $query) => $query->whereDate('start_date', '<=', $to->toDateString()))
            ->orderBy('start_date')
            ->orderBy('due_date')
            ->get()
            ->map(function (Task $task): array {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'start_date' => optional($task->start_date)->toDateString(),
                    'due_date' => optional($task->due_date)->toDateString(),
                    'project' => $task->project ? [
                        'id' => $task->project->id,
                        'name' => $task->project->name,
                    ] : null,
                ];
            })
            ->all();
    }
}
