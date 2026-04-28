<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    public function signIn(User $user, ?string $note, ?string $ip): Attendance
    {
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::firstOrCreate(
            ['user_id' => $user->id, 'date' => $today],
            ['note' => $note]
        );

        if ($attendance->signed_in_at !== null) {
            throw ValidationException::withMessages([
                'attendance' => ['You are already signed in today.'],
            ]);
        }

        $attendance->update([
            'signed_in_at' => now(),
            'sign_in_ip' => $ip,
            'note' => $note,
        ]);

        return $attendance->fresh();
    }

    public function signOut(User $user, ?string $note, ?string $ip): Attendance
    {
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('date', $today)
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
            'note' => $note ?? $attendance->note,
        ]);

        return $attendance->fresh();
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
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhereBetween('end_date', [$start->toDateString(), $end->toDateString()]);
            });

        if ($userId) {
            $leaveQuery->where('user_id', $userId);
        }

        return [
            'month' => $month->format('Y-m'),
            'attendances' => $attendanceQuery->orderBy('date')->get(),
            'leave_requests' => $leaveQuery->orderBy('start_date')->get(),
        ];
    }
}
