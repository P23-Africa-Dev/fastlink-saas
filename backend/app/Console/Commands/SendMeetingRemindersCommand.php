<?php

namespace App\Console\Commands;

use App\Services\MeetingService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendMeetingRemindersCommand extends Command
{
    protected $signature = 'meetings:send-reminders';

    protected $description = 'Send due meeting reminders using cron-friendly synchronous processing.';

    public function handle(MeetingService $meetingService): int
    {
        $sent = $meetingService->processDueReminders(Carbon::now());

        $this->info("Meeting reminders processed. Sent {$sent} reminder(s).");

        return self::SUCCESS;
    }
}
