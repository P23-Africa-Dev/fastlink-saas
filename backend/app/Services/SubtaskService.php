<?php

namespace App\Services;

use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SubtaskService
{
    /**
     * Create subtasks for a task, assigning positions in order.
     *
     * @param  Task         $task
     * @param  string[]     $titles   Non-empty, pre-validated title strings
     * @return Collection<int, Subtask>
     */
    public function createSubtasks(Task $task, array $titles): Collection
    {
        $titles = collect($titles)
            ->map(fn(string $t) => trim($t))
            ->filter(fn(string $t) => $t !== '')
            ->unique()
            ->values();

        if ($titles->isEmpty()) {
            return collect();
        }

        $now = now();
        $rows = $titles->map(fn(string $title, int $idx) => [
            'task_id'      => $task->id,
            'title'        => $title,
            'is_completed' => false,
            'completed_at' => null,
            'position'     => $idx,
            'created_at'   => $now,
            'updated_at'   => $now,
        ])->all();

        Subtask::insert($rows);

        return $task->subtasks()->get();
    }

    /**
     * Toggle a subtask's completion state and, inside a transaction,
     * sync the parent task's status according to automation rules.
     *
     * Status rules:
     *  - All subtasks completed  → parent becomes 'completed'
     *  - At least one completed  → parent becomes 'in_progress'
     *  - None completed          → parent status is left unchanged
     *    (handles un-check scenarios gracefully)
     *
     * Returns the refreshed Subtask.
     */
    public function toggle(Subtask $subtask, bool $isCompleted): Subtask
    {
        return DB::transaction(function () use ($subtask, $isCompleted): Subtask {
            $subtask->update([
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? now() : null,
            ]);

            $this->syncParentStatus($subtask->task);

            return $subtask->fresh();
        });
    }

    /**
     * Recalculate and persist the parent task's automated status.
     * Called after any subtask state change.
     */
    public function syncParentStatus(Task $task): void
    {
        $total     = $task->subtasks()->count();
        $completed = $task->subtasks()->where('is_completed', true)->count();

        if ($total === 0) {
            return; // No subtasks → do not touch parent status
        }

        if ($completed === $total) {
            $task->update([
                'status'       => 'completed',
                'completed_at' => now(),
            ]);
        } elseif ($completed > 0) {
            $task->update([
                'status'       => 'in_progress',
                'completed_at' => null,
            ]);
        }
        // If $completed === 0, leave status as-is (user may have set it manually)
    }

    /**
     * Build the subtask_progress meta appended to task responses.
     *
     * @param  Task  $task   Must already have subtasks loaded
     * @return array{total: int, completed: int, percentage: int}
     */
    public function progress(Task $task): array
    {
        $subtasks  = $task->relationLoaded('subtasks') ? $task->subtasks : $task->subtasks()->get();
        $total     = $subtasks->count();
        $completed = $subtasks->where('is_completed', true)->count();

        return [
            'total'      => $total,
            'completed'  => $completed,
            'percentage' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
        ];
    }
}
