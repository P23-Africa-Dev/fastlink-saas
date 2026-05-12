<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\Notification;
use App\Notifications\MeetingCancelledNotification;
use App\Notifications\MeetingInvitationNotification;
use App\Notifications\MeetingReminderNotification;
use App\Notifications\MeetingUpdatedNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class MeetingNotificationService
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * @param Collection<int, string> $externalEmails
     */
    public function sendInvitations(Meeting $meeting, Collection $externalEmails): void
    {
        $meeting->loadMissing(['organizer', 'attendees']);

        if ($meeting->attendees->isNotEmpty()) {
            NotificationFacade::send($meeting->attendees, new MeetingInvitationNotification($meeting));

            $this->notificationService->notifyUsers(
                $meeting->attendees->pluck('id')->all(),
                'meeting.invited',
                'New meeting invitation',
                'You were invited to "' . $meeting->title . '".',
                [
                    'meeting_id' => $meeting->id,
                    'organizer_id' => $meeting->organizer_id,
                    'meet_link' => $meeting->meet_link,
                ],
                Notification::PRIORITY_HIGH,
                'meeting:invited:' . $meeting->id
            );
        }

        $externalEmails
            ->filter(fn($email): bool => is_string($email) && trim($email) !== '')
            ->each(function (string $email) use ($meeting): void {
                NotificationFacade::route('mail', $email)
                    ->notify(new MeetingInvitationNotification($meeting));
            });
    }

    public function sendUpdate(Meeting $meeting): void
    {
        $meeting->loadMissing('attendees');

        if ($meeting->attendees->isNotEmpty()) {
            NotificationFacade::send($meeting->attendees, new MeetingUpdatedNotification($meeting));

            $this->notificationService->notifyUsers(
                $meeting->attendees->pluck('id')->all(),
                'meeting.updated',
                'Meeting updated',
                'A meeting you are attending has been updated.',
                ['meeting_id' => $meeting->id],
                Notification::PRIORITY_MEDIUM,
                'meeting:updated:' . $meeting->id
            );
        }
    }

    public function sendCancellation(Meeting $meeting, ?string $reason = null): void
    {
        $meeting->loadMissing('attendees');

        if ($meeting->attendees->isNotEmpty()) {
            NotificationFacade::send($meeting->attendees, new MeetingCancelledNotification($meeting, $reason));

            $this->notificationService->notifyUsers(
                $meeting->attendees->pluck('id')->all(),
                'meeting.cancelled',
                'Meeting cancelled',
                'A meeting you were invited to has been cancelled.',
                ['meeting_id' => $meeting->id, 'reason' => $reason],
                Notification::PRIORITY_HIGH,
                'meeting:cancelled:' . $meeting->id
            );
        }
    }

    public function sendReminder(Meeting $meeting): void
    {
        $meeting->loadMissing('attendees');

        if ($meeting->attendees->isNotEmpty()) {
            NotificationFacade::send($meeting->attendees, new MeetingReminderNotification($meeting));

            $this->notificationService->notifyUsers(
                $meeting->attendees->pluck('id')->all(),
                'meeting.reminder',
                'Meeting reminder',
                'Your meeting starts soon: ' . $meeting->title,
                ['meeting_id' => $meeting->id, 'start_at' => $meeting->start_at?->toIso8601String()],
                Notification::PRIORITY_MEDIUM,
                'meeting:reminder:' . $meeting->id . ':' . now()->format('YmdHi')
            );
        }
    }
}
