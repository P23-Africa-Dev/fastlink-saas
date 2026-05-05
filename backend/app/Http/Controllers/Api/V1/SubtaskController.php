<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Subtask;
use App\Models\Task;
use App\Services\SubtaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubtaskController extends Controller
{
    public function __construct(private readonly SubtaskService $subtaskService) {}

    /**
     * GET /api/v1/tasks/{task}/subtasks
     *
     * List all subtasks for a task, ordered by position then id.
     */
    public function index(Task $task): JsonResponse
    {
        $subtasks = $task->subtasks()->get();

        return $this->success($subtasks, 'Subtasks fetched.');
    }

    /**
     * POST /api/v1/tasks/{task}/subtasks
     *
     * Add one or more subtasks to an existing task.
     *
     * Body: { "titles": ["Batch 1", "Batch 2"] }
     *   OR: { "title": "Single subtask" }
     */
    public function store(Request $request, Task $task): JsonResponse
    {
        $payload = $request->validate([
            'title'    => ['nullable', 'string', 'max:255'],
            'titles'   => ['nullable', 'array', 'max:100'],
            'titles.*' => ['required', 'string', 'max:255'],
        ]);

        // Accept either a single title or an array of titles
        $titles = [];
        if (!empty($payload['titles'])) {
            $titles = $payload['titles'];
        } elseif (!empty($payload['title'])) {
            $titles = [$payload['title']];
        }

        if (empty($titles)) {
            return $this->error('At least one title is required.', 422);
        }

        // Offset positions so new subtasks follow existing ones
        $offset = $task->subtasks()->max('position') ?? -1;
        $offset++;

        $now  = now();
        $rows = collect($titles)
            ->map(fn(string $t) => trim($t))
            ->filter(fn(string $t) => $t !== '')
            ->unique()
            ->values()
            ->map(fn(string $title, int $idx) => [
                'task_id'      => $task->id,
                'title'        => $title,
                'is_completed' => false,
                'completed_at' => null,
                'position'     => $offset + $idx,
                'created_at'   => $now,
                'updated_at'   => $now,
            ])->all();

        if (empty($rows)) {
            return $this->error('No valid subtask titles provided.', 422);
        }

        Subtask::insert($rows);

        $subtasks = $task->subtasks()->get();

        return $this->success($subtasks, 'Subtasks added.', 201);
    }

    /**
     * PUT /api/v1/subtasks/{subtask}
     *
     * Update a subtask's title or completion state.
     * When toggling is_completed, parent task status is automated.
     *
     * Body: { "is_completed": true }
     *   OR: { "title": "New title" }
     *   OR both.
     */
    public function update(Request $request, Subtask $subtask): JsonResponse
    {
        $payload = $request->validate([
            'title'        => ['sometimes', 'string', 'max:255'],
            'is_completed' => ['sometimes', 'boolean'],
        ]);

        if (isset($payload['is_completed'])) {
            $subtask = $this->subtaskService->toggle($subtask, (bool) $payload['is_completed']);

            // If a title change was also requested, apply it now
            if (isset($payload['title'])) {
                $subtask->update(['title' => trim($payload['title'])]);
                $subtask = $subtask->fresh();
            }
        } elseif (isset($payload['title'])) {
            $subtask->update(['title' => trim($payload['title'])]);
            $subtask = $subtask->fresh();
        }

        return $this->success($subtask, 'Subtask updated.');
    }

    /**
     * DELETE /api/v1/subtasks/{subtask}
     */
    public function destroy(Subtask $subtask): JsonResponse
    {
        $task = $subtask->task;

        $subtask->delete();

        // Re-sync parent status after deletion
        $this->subtaskService->syncParentStatus($task);

        return $this->success(null, 'Subtask deleted.');
    }
}
