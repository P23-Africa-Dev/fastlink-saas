<?php

namespace App\Notifications;

use App\Models\Meeting;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MeetingCancelledNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Meeting $meeting,
        private readonly ?string $reason = null,
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
        return (new MailMessage)
            ->subject('Meeting Cancelled: ' . $this->meeting->title)
            ->line('A meeting has been cancelled.')
            ->line('Title: ' . $this->meeting->title)
            ->line('Organizer: ' . ($this->meeting->organizer?->name ?? 'N/A'))
            ->line('Reason: ' . ($this->reason ?: 'No reason provided.'));
    }
}
