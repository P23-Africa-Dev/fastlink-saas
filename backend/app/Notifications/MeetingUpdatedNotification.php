<?php

namespace App\Notifications;

use App\Models\Meeting;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MeetingUpdatedNotification extends Notification
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
        $timezone = (string) ($this->meeting->timezone ?: 'Africa/Lagos');
        $start = Carbon::parse((string) $this->meeting->start_at)->setTimezone($timezone)->format('Y-m-d H:i');
        $end = Carbon::parse((string) $this->meeting->end_at)->setTimezone($timezone)->format('Y-m-d H:i');

        return (new MailMessage)
            ->subject('Meeting Updated: ' . $this->meeting->title)
            ->line('A meeting you are invited to has been updated.')
            ->line('Title: ' . $this->meeting->title)
            ->line('Updated Time: ' . $start . ' to ' . $end . ' (' . $timezone . ')')
            ->when(!empty($this->meeting->meet_link), fn(MailMessage $mail): MailMessage => $mail->action('Open Google Meet', (string) $this->meeting->meet_link));
    }
}
