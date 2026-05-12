<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meeting\CreateMeetingRequest;
use App\Http\Requests\Meeting\ListMeetingRequest;
use App\Http\Requests\Meeting\UpdateMeetingRequest;
use App\Models\Meeting;
use App\Services\MeetingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingController extends Controller
{
    public function __construct(
        private readonly MeetingService $meetingService,
    ) {}

    public function index(ListMeetingRequest $request): JsonResponse
    {
        $paginator = $this->meetingService->listForUser($request->user(), $request->validated());

        return $this->paginated($paginator, $paginator->items(), 'Meetings fetched.');
    }

    public function store(CreateMeetingRequest $request): JsonResponse
    {
        $meeting = $this->meetingService->create($request->user(), $request->validated());

        return $this->success($meeting, 'Meeting created.', 201);
    }

    public function show(Meeting $meeting, Request $request): JsonResponse
    {
        $this->meetingService->assertCanView($meeting, $request->user());
        $meeting->load(['organizer:id,name,email', 'attendees:id,name,email', 'reminders']);

        return $this->success($meeting, 'Meeting fetched.', 200);
    }

    public function update(Meeting $meeting, UpdateMeetingRequest $request): JsonResponse
    {
        $updated = $this->meetingService->update($meeting, $request->user(), $request->validated());

        return $this->success($updated, 'Meeting updated.', 200);
    }

    public function destroy(Meeting $meeting, Request $request): JsonResponse
    {
        $reason = $request->input('reason');
        $cancelled = $this->meetingService->cancel($meeting, $request->user(), is_string($reason) ? $reason : null);

        return $this->success($cancelled, 'Meeting cancelled.', 200);
    }

    public function calendarMeetings(ListMeetingRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['per_page'] = $filters['per_page'] ?? 200;

        $paginator = $this->meetingService->listForUser($request->user(), $filters);

        return $this->success($paginator->items(), 'Calendar meetings fetched.', 200, [
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }
}
