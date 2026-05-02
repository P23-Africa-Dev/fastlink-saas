<?php

namespace App\Console\Commands;

use App\Services\AttendanceService;
use Illuminate\Console\Command;

class AutoClockOutAttendanceCommand extends Command
{
    protected $signature = 'attendance:auto-clock-out';

    protected $description = 'Automatically clock out users at or after 6:00 PM for open attendance records.';

    public function handle(AttendanceService $attendanceService): int
    {
        $updated = $attendanceService->autoClockOutOverdue();

        $this->info("Auto clock-out completed. Updated {$updated} attendance record(s).");

        return self::SUCCESS;
    }
}
