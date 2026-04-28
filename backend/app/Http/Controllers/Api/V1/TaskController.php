<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\ReorderTaskRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Task;
use App\Models\TaskComment;
use App\Services\TaskBoardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct(private readonly TaskBoardService $taskBoardService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Task::query()
            ->with(['project:id,name', 'creator:id,name,email', 'assignees:id,name,email'])
            ->withCount('comments')
            ->when($request->string('q')->toString(), function ($builder, $q) {
                $builder->where(function ($inner) use ($q) {
                    $inner->where('title', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when($request->filled('project_id'), fn ($builder) => $builder->where('project_id', (int) $request->input('project_id')))
            ->when($request->filled('status'), fn ($builder) => $builder->where('status', $request->string('status')))
            ->when($request->filled('priority'), fn ($builder) => $builder->where('priority', $request->string('priority')))
            ->orderBy('order')
            ->orderByDesc('id');

        $tasks = $query->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($tasks, $tasks->items(), 'Tasks fetched.');
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $assigneeIds = $payload['assignee_ids'] ?? [];
        unset($payload['assignee_ids']);

        $payload['created_by'] = $request->user()->id;
        $task = Task::create($payload);

        if (!empty($assigneeIds)) {
            $syncData = collect($assigneeIds)->mapWithKeys(fn (int $id) => [$id => ['assigned_by' => $request->user()->id]])->all();
            $task->assignees()->sync($syncData);
        }

        return $this->success($task->load(['project:id,name', 'assignees:id,name,email']), 'Task created.', 201);
    }

    public function show(Task $task): JsonResponse
    {
        return $this->success(
            $task->load([
                'project:id,name',
                'creator:id,name,email',
                'assignees:id,name,email',
                'comments.user:id,name,email',
            ]),
            'Task fetched.'
        );
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $payload = $request->validated();
        $assigneeIds = $payload['assignee_ids'] ?? null;
        unset($payload['assignee_ids']);

        if (array_key_exists('status', $payload)) {
            $payload['completed_at'] = $payload['status'] === 'completed' ? now() : null;
        }

        $task->update($payload);

        if (is_array($assigneeIds)) {
            $syncData = collect($assigneeIds)->mapWithKeys(fn (int $id) => [$id => ['assigned_by' => $request->user()->id]])->all();
            $task->assignees()->sync($syncData);
        }

        return $this->success($task->fresh()->load(['project:id,name', 'assignees:id,name,email']), 'Task updated.');
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return $this->success(null, 'Task deleted.');
    }

    public function kanban(Request $request): JsonResponse
    {
        return $this->success(
            $this->taskBoardService->kanban($request->integer('project_id')),
            'Kanban data fetched.'
        );
    }

    public function reorder(ReorderTaskRequest $request, Task $task): JsonResponse
    {
        $task->update($request->validated());

        return $this->success($task->fresh(), 'Task order updated.');
    }

    public function addComment(Request $request, Task $task): JsonResponse
    {
        $payload = $request->validate([
            'comment' => ['required', 'string'],
            'attachments' => ['nullable', 'array'],
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'comment' => $payload['comment'],
            'attachments' => $payload['attachments'] ?? null,
        ]);

        return $this->success($comment->load('user:id,name,email'), 'Task comment added.', 201);
    }

    public function assign(Request $request, Task $task): JsonResponse
    {
        $payload = $request->validate([
            'assignee_ids' => ['required', 'array'],
            'assignee_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $syncData = collect($payload['assignee_ids'])->mapWithKeys(fn (int $id) => [$id => ['assigned_by' => $request->user()->id]])->all();
        $task->assignees()->sync($syncData);

        return $this->success($task->fresh()->load('assignees:id,name,email'), 'Task assignees updated.');
    }
}
