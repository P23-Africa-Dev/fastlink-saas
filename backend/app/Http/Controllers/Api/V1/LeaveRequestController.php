<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\DecideLeaveRequest;
use App\Http\Requests\Leave\StoreLeaveRequest;
use App\Http\Requests\Leave\UpdateLeaveRequest;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Notifications\LeaveRequestWorkflowNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Throwable;

class LeaveRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = LeaveRequest::query()
            ->with(['user:id,name,email', 'supervisor:id,name,email'])
            ->when($request->filled('status'), fn($builder) => $builder->where('status', $request->string('status')))
            ->when($request->filled('from'), fn($builder) => $builder->whereDate('start_date', '>=', $request->string('from')))
            ->when($request->filled('to'), fn($builder) => $builder->whereDate('end_date', '<=', $request->string('to')))
            ->orderByDesc('id');

        if ($user->hasRole('staff')) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->input('user_id'));
        }

        $leaveRequests = $query->paginate((int) $request->integer('per_page', 20));

        return $this->paginated($leaveRequests, $leaveRequests->items(), 'Leave requests fetched.');
    }

    public function store(StoreLeaveRequest $request): JsonResponse
    {
        $payload = $request->validated();

        $start = Carbon::parse($payload['start_date']);
        $end = Carbon::parse($payload['end_date']);
        $duration = $start->diffInDays($end) + 1;

        $leaveRequest = LeaveRequest::create([
            'user_id' => $request->user()->id,
            'supervisor_id' => $payload['supervisor_id'] ?? null,
            'type' => $payload['type'],
            'reason' => $payload['reason'] ?? null,
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'],
            'duration_days' => $duration,
            'status' => 'pending',
        ]);

        $leaveRequest->load(['user:id,name,email', 'supervisor:id,name,email']);
        $this->notifyLeaveStakeholders($leaveRequest, 'created', $request->user(), $leaveRequest->supervisor_id, $leaveRequest->user_id);

        return $this->success($leaveRequest, 'Leave request created.', 201);
    }

    public function update(UpdateLeaveRequest $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if ((int) $leaveRequest->user_id !== (int) $request->user()->id) {
            return $this->error('Forbidden.', 403);
        }

        if (!in_array($leaveRequest->status, ['pending', 'modified'], true)) {
            return $this->error('Only pending/modified requests can be updated.', 422);
        }

        $payload = $request->validated();

        if (array_key_exists('start_date', $payload) || array_key_exists('end_date', $payload)) {
            $start = Carbon::parse($payload['start_date'] ?? $leaveRequest->start_date);
            $end = Carbon::parse($payload['end_date'] ?? $leaveRequest->end_date);
            $payload['duration_days'] = $start->diffInDays($end) + 1;
        }

        $leaveRequest->update($payload);
        $leaveRequest->refresh()->load(['user:id,name,email', 'supervisor:id,name,email']);

        $this->notifyLeaveStakeholders($leaveRequest, 'updated', $request->user(), $leaveRequest->supervisor_id, $leaveRequest->user_id);

        return $this->success($leaveRequest, 'Leave request updated.');
    }

    public function cancel(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if ((int) $leaveRequest->user_id !== (int) $request->user()->id) {
            return $this->error('Forbidden.', 403);
        }

        if (in_array($leaveRequest->status, ['cancelled', 'rejected', 'sender_not_okay'], true)) {
            return $this->error('This leave request cannot be cancelled.', 422);
        }

        $payload = $request->validate([
            'reason' => ['nullable', 'string'],
        ]);

        $leaveRequest->status = 'cancelled';
        $leaveRequest->sender_response_note = $payload['reason'] ?? $leaveRequest->sender_response_note;
        $leaveRequest->sender_responded_at = now();
        $leaveRequest->save();

        $leaveRequest->refresh()->load(['user:id,name,email', 'supervisor:id,name,email']);
        $this->notifyLeaveStakeholders($leaveRequest, 'cancelled', $request->user(), $leaveRequest->supervisor_id, $leaveRequest->user_id, $payload['reason'] ?? null);

        return $this->success($leaveRequest, 'Leave request cancelled.');
    }

    public function show(LeaveRequest $leaveRequest): JsonResponse
    {
        $user = request()->user();

        if ($user->hasRole('staff') && (int) $leaveRequest->user_id !== (int) $user->id) {
            return $this->error('Forbidden.', 403);
        }

        return $this->success($leaveRequest->load(['user:id,name,email', 'supervisor:id,name,email']), 'Leave request fetched.');
    }

    public function decide(DecideLeaveRequest $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if ($request->user()->hasRole('staff')) {
            return $this->error('Only supervisors/admins can decide leave requests.', 403);
        }

        $payload = $request->validated();

        $leaveRequest->supervisor_id = $request->user()->id;
        $leaveRequest->status = $payload['status'];
        $leaveRequest->supervisor_note = $payload['supervisor_note'] ?? null;
        $leaveRequest->decision_note = $payload['decision_note'] ?? null;

        if ($payload['status'] === 'modified') {
            $modifiedStart = Carbon::parse($payload['modified_start_date']);
            $modifiedEnd = Carbon::parse($payload['modified_end_date']);

            $leaveRequest->modified_start_date = $payload['modified_start_date'];
            $leaveRequest->modified_end_date = $payload['modified_end_date'];
            $leaveRequest->modified_duration_days = $modifiedStart->diffInDays($modifiedEnd) + 1;
        } else {
            $leaveRequest->decided_at = now();
        }

        $leaveRequest->save();

        $leaveRequest->refresh()->load(['user:id,name,email', 'supervisor:id,name,email']);
        // On decision, requester plus admins plus currently assigned supervisor are notified.
        $this->notifyLeaveStakeholders($leaveRequest, $leaveRequest->status, $request->user(), $leaveRequest->supervisor_id, $request->user()->id, $leaveRequest->decision_note ?? $leaveRequest->supervisor_note);

        $requester = User::query()->find($leaveRequest->user_id);
        if ($requester && (int) $requester->id !== (int) $request->user()->id) {
            $this->sendLeaveNotification(collect([$requester]), $leaveRequest, $leaveRequest->status, $request->user(), $leaveRequest->decision_note ?? $leaveRequest->supervisor_note);
        }

        return $this->success($leaveRequest, 'Leave request decision saved.');
    }

    public function respond(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $payload = $request->validate([
            'accept' => ['required', 'boolean'],
            'sender_response_note' => ['nullable', 'string'],
        ]);

        if ((int) $leaveRequest->user_id !== (int) $request->user()->id) {
            return $this->error('Forbidden.', 403);
        }

        if ($leaveRequest->status !== 'modified') {
            return $this->error('Only modified requests can be responded to.', 422);
        }

        $leaveRequest->status = $payload['accept'] ? 'sender_okay' : 'sender_not_okay';
        $leaveRequest->sender_response_note = $payload['sender_response_note'] ?? null;
        $leaveRequest->sender_responded_at = now();
        $leaveRequest->save();

        $leaveRequest->refresh()->load(['user:id,name,email', 'supervisor:id,name,email']);
        $this->notifyLeaveStakeholders($leaveRequest, $leaveRequest->status, $request->user(), $leaveRequest->supervisor_id, $leaveRequest->user_id, $leaveRequest->sender_response_note);

        return $this->success($leaveRequest, 'Leave request response saved.');
    }

    public function calendar(Request $request): JsonResponse
    {
        $month = $request->filled('month')
            ? Carbon::createFromFormat('Y-m', (string) $request->input('month'))
            : now();

        $start = $month->copy()->startOfMonth()->toDateString();
        $end = $month->copy()->endOfMonth()->toDateString();

        $query = LeaveRequest::query()
            ->with(['user:id,name,email', 'supervisor:id,name,email'])
            ->where(function ($builder) use ($start, $end) {
                $builder->whereBetween('start_date', [$start, $end])
                    ->orWhereBetween('end_date', [$start, $end]);
            })
            ->orderBy('start_date');

        if ($request->user()->hasRole('staff')) {
            $query->where('user_id', $request->user()->id);
        }

        return $this->success([
            'month' => $month->format('Y-m'),
            'leave_requests' => $query->get(),
        ], 'Leave calendar fetched.');
    }

    private function notifyLeaveStakeholders(LeaveRequest $leaveRequest, string $event, User $actor, ?int $targetSupervisorId = null, ?int $excludeUserId = null, ?string $note = null): void
    {
        $adminIds = User::query()->role('admin')->pluck('id')->all();
        $recipientIds = $adminIds;

        if ($targetSupervisorId) {
            $recipientIds[] = $targetSupervisorId;
        }

        $recipientIds = array_values(array_unique(array_filter($recipientIds, fn($id) => $id !== null)));

        if ($excludeUserId) {
            $recipientIds = array_values(array_filter($recipientIds, fn($id) => (int) $id !== (int) $excludeUserId));
        }

        if (empty($recipientIds)) {
            return;
        }

        $users = User::query()->whereIn('id', $recipientIds)->get();
        $this->sendLeaveNotification($users, $leaveRequest, $event, $actor, $note);
    }

    private function sendLeaveNotification(iterable $users, LeaveRequest $leaveRequest, string $event, User $actor, ?string $note = null): void
    {
        $users = collect($users);

        if ($users->isEmpty()) {
            return;
        }

        try {
            Notification::send($users, new LeaveRequestWorkflowNotification($leaveRequest, $actor, $event, $note));
        } catch (Throwable $e) {
            report($e);
        }
    }
}
