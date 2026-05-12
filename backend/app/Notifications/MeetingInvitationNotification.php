<?php

namespace App\Notifications;

use App\Models\Meeting;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MeetingInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Meeting $meeting,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = trim((string) ($notifiable->name ?? 'there'));
        $timezone = (string) ($this->meeting->timezone ?: 'Africa/Lagos');
        $start = Carbon::parse((string) $this->meeting->start_at)->setTimezone($timezone)->format('Y-m-d H:i');
        $end = Carbon::parse((string) $this->meeting->end_at)->setTimezone($timezone)->format('Y-m-d H:i');

        return (new MailMessage)
            ->subject('Meeting Invitation: ' . $this->meeting->title)
            ->greeting('Hello ' . $name . ',')
            ->line('You have been invited to a meeting in FastLink SaaS.')
            ->line('Title: ' . $this->meeting->title)
            ->line('Organizer: ' . ($this->meeting->organizer?->name ?? 'N/A'))
            ->line('Date & Time: ' . $start . ' to ' . $end . ' (' . $timezone . ')')
            ->line('Description: ' . ($this->meeting->description ?: 'N/A'))
            ->when(!empty($this->meeting->meet_link), fn(MailMessage $mail): MailMessage => $mail->action('Join Google Meet', (string) $this->meeting->meet_link))
            ->line('You will also receive Google Calendar RSVP invitation if Google sync is enabled.');
    }
}
