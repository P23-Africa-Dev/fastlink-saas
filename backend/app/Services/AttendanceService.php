<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    public function autoClockOutOverdue(?Carbon $reference = null): int
    {
        $now = ($reference ?? now())->copy()->timezone(config('app.timezone'));
        $today = $now->toDateString();
        $updated = 0;

        Attendance::query()
            ->whereNotNull('signed_in_at')
            ->whereNull('signed_out_at')
            ->whereDate('date', '<=', $today)
            ->orderBy('id')
            ->chunkById(200, function ($rows) use (&$updated, $now) {
                foreach ($rows as $attendance) {
                    $cutoff = Carbon::parse($attendance->date->toDateString(), config('app.timezone'))
                        ->setTime(18, 0, 0);

                    if ($now->lt($cutoff)) {
                        continue;
                    }

                    $attendance->update([
                        'signed_out_at' => $cutoff,
                        'sign_out_ip' => $attendance->sign_out_ip ?? 'AUTO_SYSTEM',
                    ]);

                    $updated++;
                }
            });

        return $updated;
    }

    public function signIn(User $user, ?string $note, ?string $ip): Attendance
    {
        $today = Carbon::today(config('app.timezone'))->toDateString();
        $normalizedNote = $this->normalizeNote($note);

        return DB::transaction(function () use ($user, $today, $normalizedNote, $ip) {
            $attendance = Attendance::query()
                ->where('user_id', $user->id)
                ->whereDate('date', $today)
                ->lockForUpdate()
                ->first();

            if (!$attendance) {
                $attendance = Attendance::create([
                    'user_id' => $user->id,
                    'date' => $today,
                    'note' => $normalizedNote,
                ]);
            }

            if ($attendance->signed_in_at !== null) {
                throw ValidationException::withMessages([
                    'attendance' => ['You are already signed in today.'],
                ]);
            }

            $attendance->update([
                'signed_in_at' => now(),
                'sign_in_ip' => $ip,
                'note' => $normalizedNote,
            ]);

            return $attendance->fresh();
        });
    }

    public function signOut(User $user, ?string $note, ?string $ip): Attendance
    {
        $today = Carbon::today(config('app.timezone'))->toDateString();
        $normalizedNote = $this->normalizeNote($note);

        return DB::transaction(function () use ($user, $today, $normalizedNote, $ip) {
            $attendance = Attendance::query()
                ->where('user_id', $user->id)
                ->whereDate('date', $today)
                ->lockForUpdate()
                ->first();

            if (!$attendance || $attendance->signed_in_at === null) {
                throw ValidationException::withMessages([
                    'attendance' => ['You must sign in before signing out.'],
                ]);
            }

            if ($attendance->signed_out_at !== null) {
                throw ValidationException::withMessages([
                    'attendance' => ['You are already signed out today.'],
                ]);
            }

            $attendance->update([
                'signed_out_at' => now(),
                'sign_out_ip' => $ip,
                'note' => $normalizedNote ?? $attendance->note,
            ]);

            return $attendance->fresh();
        });
    }

    public function calendar(Carbon $month, ?int $userId = null): array
    {
        $start = $month->copy()->startOfMonth()->startOfDay();
        $end = $month->copy()->endOfMonth()->endOfDay();

        $attendanceQuery = Attendance::query()
            ->with('user:id,name,email')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()]);

        if ($userId) {
            $attendanceQuery->where('user_id', $userId);
        }

        $leaveQuery = LeaveRequest::query()
            ->with(['user:id,name,email', 'supervisor:id,name,email'])
            ->whereNotIn('status', ['rejected', 'cancelled'])
            ->whereRaw('COALESCE(modified_start_date, start_date) <= ?', [$end->toDateString()])
            ->whereRaw('COALESCE(modified_end_date, end_date) >= ?', [$start->toDateString()]);

        $taskQuery = Task::query()
            ->with(['project:id,name', 'assignees:id,name,email'])
            ->where(function ($query) use ($start, $end) {
                $query
                    ->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhereBetween('due_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhere(function ($range) use ($start, $end) {
                        $range->whereNotNull('start_date')
                            ->whereNotNull('due_date')
                            ->whereDate('start_date', '<=', $start->toDateString())
                            ->whereDate('due_date', '>=', $end->toDateString());
                    });
            });

        if ($userId) {
            $leaveQuery->where('user_id', $userId);
            $taskQuery->where(function ($query) use ($userId) {
                $query->where('created_by', $userId)
                    ->orWhereHas('assignees', fn($assignees) => $assignees->where('users.id', $userId));
            });
        }

        return [
            'month' => $month->format('Y-m'),
            'attendances' => $attendanceQuery->orderBy('date')->get(),
            'leave_requests' => $leaveQuery->orderBy('start_date')->get(),
            'tasks' => $taskQuery->orderBy('start_date')->orderBy('due_date')->get(),
        ];
    }

    private function normalizeNote(?string $note): ?string
    {
        if ($note === null) {
            return null;
        }

        $trimmed = trim($note);

        return $trimmed === '' ? null : $trimmed;
    }
}
