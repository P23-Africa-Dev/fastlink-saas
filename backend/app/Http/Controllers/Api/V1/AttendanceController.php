<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\SignInRequest;
use App\Http\Requests\Attendance\SignOutRequest;
use App\Models\Attendance;
use App\Services\ActivityLogService;
use App\Services\AttendanceService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceService $attendanceService,
        private readonly NotificationService $notificationService,
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->attendanceService->autoClockOutOverdue();

        $user = $request->user();

        $query = Attendance::query()
            ->with('user:id,name,email')
            ->when($request->filled('from'), fn($builder) => $builder->whereDate('date', '>=', $request->string('from')))
            ->when($request->filled('to'), fn($builder) => $builder->whereDate('date', '<=', $request->string('to')))
            ->orderByDesc('date');

        if ($user->hasRole('staff')) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->input('user_id'));
        }

        $attendances = $query->paginate((int) $request->integer('per_page', 20));

        return $this->paginated($attendances, $attendances->items(), 'Attendance logs fetched.');
    }

    public function signIn(SignInRequest $request): JsonResponse
    {
        $this->attendanceService->autoClockOutOverdue();

        $attendance = $this->attendanceService->signIn(
            $request->user(),
            $request->string('note')->toString() ?: null,
            $request->ip()
        );

        $recipients = $this->notificationService->roleUserIds('admin', 'supervisor')
            ->filter(fn ($id) => (int) $id !== (int) $request->user()->id);

        $this->notificationService->notifyUsers(
            $recipients,
            'attendance.clock_in',
            'User clocked in',
            "{$request->user()->name} clocked in.",
            ['attendance_id' => $attendance->id, 'user_id' => $request->user()->id],
            'medium',
            'attendance.clock_in:' . $attendance->id
        );

        $this->activityLogService->log(
            $request->user(),
            'attendance.clock_in',
            'User clocked in',
            ['attendance_id' => $attendance->id]
        );

        return $this->success($attendance->load('user:id,name,email'), 'Signed in successfully.');
    }

    public function signOut(SignOutRequest $request): JsonResponse
    {
        $this->attendanceService->autoClockOutOverdue();

        $attendance = $this->attendanceService->signOut(
            $request->user(),
            $request->string('note')->toString() ?: null,
            $request->ip()
        );

        $recipients = $this->notificationService->roleUserIds('admin', 'supervisor')
            ->filter(fn ($id) => (int) $id !== (int) $request->user()->id);

        $this->notificationService->notifyUsers(
            $recipients,
            'attendance.clock_out',
            'User clocked out',
            "{$request->user()->name} clocked out.",
            ['attendance_id' => $attendance->id, 'user_id' => $request->user()->id],
            'medium',
            'attendance.clock_out:' . $attendance->id
        );

        $this->activityLogService->log(
            $request->user(),
            'attendance.clock_out',
            'User clocked out',
            ['attendance_id' => $attendance->id]
        );

        return $this->success($attendance->load('user:id,name,email'), 'Signed out successfully.');
    }

    public function calendar(Request $request): JsonResponse
    {
        $this->attendanceService->autoClockOutOverdue();

        $month = $request->filled('month')
            ? Carbon::createFromFormat('Y-m', (string) $request->input('month'))
            : now();

        $userId = null;
        if (!$request->user()->hasRole('staff') && $request->filled('user_id')) {
            $userId = (int) $request->input('user_id');
        }

        if ($request->user()->hasRole('staff')) {
            $userId = $request->user()->id;
        }

        return $this->success(
            $this->attendanceService->calendar($month, $userId),
            'Attendance calendar fetched.'
        );
    }
}
