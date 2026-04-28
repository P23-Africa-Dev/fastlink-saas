<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\SignInRequest;
use App\Http\Requests\Attendance\SignOutRequest;
use App\Models\Attendance;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendanceService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Attendance::query()
            ->with('user:id,name,email')
            ->when($request->filled('from'), fn ($builder) => $builder->whereDate('date', '>=', $request->string('from')))
            ->when($request->filled('to'), fn ($builder) => $builder->whereDate('date', '<=', $request->string('to')))
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
        $attendance = $this->attendanceService->signIn(
            $request->user(),
            $request->string('note')->toString() ?: null,
            $request->ip()
        );

        return $this->success($attendance->load('user:id,name,email'), 'Signed in successfully.');
    }

    public function signOut(SignOutRequest $request): JsonResponse
    {
        $attendance = $this->attendanceService->signOut(
            $request->user(),
            $request->string('note')->toString() ?: null,
            $request->ip()
        );

        return $this->success($attendance->load('user:id,name,email'), 'Signed out successfully.');
    }

    public function calendar(Request $request): JsonResponse
    {
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
