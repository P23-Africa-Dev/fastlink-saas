<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\DecideLeaveRequest;
use App\Http\Requests\Leave\StoreLeaveRequest;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = LeaveRequest::query()
            ->with(['user:id,name,email', 'supervisor:id,name,email'])
            ->when($request->filled('status'), fn ($builder) => $builder->where('status', $request->string('status')))
            ->when($request->filled('from'), fn ($builder) => $builder->whereDate('start_date', '>=', $request->string('from')))
            ->when($request->filled('to'), fn ($builder) => $builder->whereDate('end_date', '<=', $request->string('to')))
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

        return $this->success($leaveRequest->load(['user:id,name,email', 'supervisor:id,name,email']), 'Leave request created.', 201);
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

        return $this->success($leaveRequest->fresh()->load(['user:id,name,email', 'supervisor:id,name,email']), 'Leave request decision saved.');
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

        return $this->success($leaveRequest->fresh(), 'Leave request response saved.');
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
}
