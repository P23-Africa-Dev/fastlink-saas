<?php

namespace App\Notifications;

use App\Models\LeadFollowup;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeadFollowupApprovalRequestedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly LeadFollowup $followup,
        private readonly User $requester,
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
        $loginUrl = rtrim((string) config('app.frontend_login_url', 'http://localhost:3000'), '/');
        $leadName = trim(($this->followup->lead?->first_name ?? '') . ' ' . ($this->followup->lead?->last_name ?? ''));

        return (new MailMessage)
            ->subject('Follow-up modification approval required')
            ->greeting("Hello {$notifiable->name},")
            ->line("{$this->requester->name} submitted a modification request for your lead follow-up.")
            ->line('Lead: ' . ($leadName !== '' ? $leadName : ('Lead #' . $this->followup->lead_id)))
            ->line('Follow-up: ' . $this->followup->title)
            ->action('Review Request', $loginUrl)
            ->line('Please approve or reject the request from your dashboard.');
    }
}
