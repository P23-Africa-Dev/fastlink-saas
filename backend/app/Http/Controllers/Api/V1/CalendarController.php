<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Calendar\CalendarEventsRequest;
use App\Http\Requests\Calendar\StoreCalendarTaskRequest;
use App\Models\Task;
use App\Services\CalendarService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class CalendarController extends Controller
{
    public function __construct(
        private readonly CalendarService $calendarService,
    ) {}

    /**
     * Get unified calendar events for a date range.
     *
     * @param CalendarEventsRequest $request
     * @return JsonResponse
     */
    public function events(CalendarEventsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $startDate = Carbon::createFromFormat('Y-m-d', $validated['start_date'])->startOfDay();
        $endDate = Carbon::createFromFormat('Y-m-d', $validated['end_date'])->endOfDay();
        $type = $validated['type'] ?? null;

        $events = $this->calendarService->getEvents($startDate, $endDate, $type);

        return $this->success($events, 'Calendar events fetched.', 200);
    }

    /**
     * Create a task from calendar.
     *
     * @param StoreCalendarTaskRequest $request
     * @return JsonResponse
     */
    public function storeTask(StoreCalendarTaskRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Prepare task payload
        $payload = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'],
            'due_date' => $validated['due_date'],
            'project_id' => $validated['project_id'] ?? null,
            'status' => $validated['status'] ?? 'todo',
            'priority' => $validated['priority'] ?? 'medium',
            'created_by' => $request->user()->id,
            'order' => 0,
        ];

        // Create task
        $task = Task::create($payload);

        // Assign task if assigned_to is provided
        if (!empty($validated['assigned_to'])) {
            $task->assignees()->sync([
                $validated['assigned_to'] => ['assigned_by' => $request->user()->id]
            ]);
        }

        // Load relationships
        $task->load(['project:id,name', 'assignees:id,name,email', 'subtasks']);

        return $this->success(
            $this->withSubtaskProgress($task),
            'Task created from calendar.',
            201
        );
    }

    /**
     * Append subtask_progress summary to the task array.
     *
     * @param Task $task
     * @return array
     */
    private function withSubtaskProgress(Task $task): array
    {
        $data = $task->toArray();
        $subtasks = $task->relationLoaded('subtasks') ? $task->subtasks : $task->subtasks()->get();
        $total = $subtasks->count();
        $done = $subtasks->where('is_completed', true)->count();

        $data['subtask_progress'] = [
            'total' => $total,
            'completed' => $done,
            'percentage' => $total > 0 ? (int) round(($done / $total) * 100) : 0,
        ];

        return $data;
    }
}
