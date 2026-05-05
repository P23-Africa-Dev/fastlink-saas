<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectTag\AssignProjectTagRequest;
use App\Http\Requests\ProjectTag\StoreProjectTagRequest;
use App\Models\ProjectTag;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectTagController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tags = ProjectTag::query()
            ->with(['creator:id,name,email', 'users:id,name,email'])
            ->orderBy('name')
            ->get();

        return $this->success($tags, 'Project tags fetched.');
    }

    public function store(StoreProjectTagRequest $request): JsonResponse
    {
        $tag = ProjectTag::query()->create([
            'name' => $request->validated('name'),
            'color' => $request->validated('color'),
            'created_by' => $request->user()->id,
        ]);

        $recipientIds = User::query()
            ->role(['admin', 'supervisor'])
            ->pluck('id');

        $this->notificationService->notifyUsers(
            $recipientIds,
            'project.tag_created',
            'New project tag created',
            "Tag {$tag->name} was created by {$request->user()->name}.",
            ['tag_id' => $tag->id, 'tag_name' => $tag->name],
            'medium',
            'project.tag_created:' . $tag->id
        );

        $this->activityLogService->log(
            $request->user(),
            'project.tag_created',
            "Created project tag {$tag->name}",
            ['tag_id' => $tag->id]
        );

        return $this->success($tag->load('creator:id,name,email'), 'Project tag created.', 201);
    }

    public function assign(AssignProjectTagRequest $request, ProjectTag $tag): JsonResponse
    {
        $target = User::query()->findOrFail((int) $request->validated('user_id'));

        if (! $target->hasRole('staff')) {
            return $this->error('Only staff users can be assigned tags.', 422);
        }

        $tag->users()->syncWithoutDetaching([
            $target->id => ['assigned_by' => $request->user()->id],
        ]);

        $this->notificationService->notifyUsers(
            [$target->id],
            'project.tag_assigned',
            'New tag assigned to you',
            "You were assigned the tag {$tag->name}.",
            ['tag_id' => $tag->id, 'tag_name' => $tag->name],
            'medium',
            'project.tag_assigned:' . $tag->id . ':' . $target->id
        );

        $this->activityLogService->log(
            $request->user(),
            'project.tag_assigned',
            "Assigned tag {$tag->name} to {$target->name}",
            ['tag_id' => $tag->id, 'assigned_user_id' => $target->id]
        );

        return $this->success($tag->fresh()->load('users:id,name,email'), 'Tag assigned.');
    }
}
