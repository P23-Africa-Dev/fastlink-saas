<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use App\Services\TaskBoardService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(
        private readonly TaskBoardService $taskBoardService,
        private readonly NotificationService $notificationService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Project::query()
            ->with('creator:id,name,email')
            ->withCount('tasks')
            ->when($request->string('q')->toString(), function ($builder, $q) {
                $builder->where(function ($inner) use ($q) {
                    $inner->where('name', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when($request->filled('status'), fn ($builder) => $builder->where('status', $request->string('status')))
            ->when($request->filled('priority'), fn ($builder) => $builder->where('priority', $request->string('priority')))
            ->orderByDesc('id');

        $projects = $query->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($projects, $projects->items(), 'Projects fetched.');
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['created_by'] = $request->user()->id;

        $project = Project::create($payload);

        $this->activityLogService->log(
            $request->user(),
            'project.created',
            "Project {$project->name} created",
            ['project_id' => $project->id, 'is_valuable' => (bool) $project->is_valuable]
        );

        if ($project->is_valuable) {
            $adminIds = $this->notificationService->roleUserIds('admin');
            $this->notificationService->notifyUsers(
                $adminIds,
                'project.valuable_created',
                'Valuable project created',
                "{$request->user()->name} created valuable project {$project->name}.",
                ['project_id' => $project->id],
                'high',
                'project.valuable_created:' . $project->id
            );
        }

        return $this->success($project->load('creator:id,name,email'), 'Project created.', 201);
    }

    public function show(Project $project): JsonResponse
    {
        return $this->success(
            $project->load([
                'creator:id,name,email',
                'tasks.assignees:id,name,email',
                'tasks.comments.user:id,name,email',
            ]),
            'Project fetched.'
        );
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project->update($request->validated());

        $this->activityLogService->log(
            $request->user(),
            'project.updated',
            "Project {$project->name} updated",
            ['project_id' => $project->id]
        );

        return $this->success($project->fresh(), 'Project updated.');
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return $this->success(null, 'Project deleted.');
    }

    public function gantt(Request $request): JsonResponse
    {
        $from = $request->filled('from') ? Carbon::parse((string) $request->input('from')) : null;
        $to = $request->filled('to') ? Carbon::parse((string) $request->input('to')) : null;

        return $this->success(
            $this->taskBoardService->gantt($from, $to),
            'Gantt data fetched.'
        );
    }
}
