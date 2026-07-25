<?php

namespace App\Notifications;

use App\Models\OrganizationInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly OrganizationInvitation $invitation,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $orgName = $this->invitation->organization?->name ?? 'an organization';
        $url = rtrim((string) config('app.frontend_login_url'), '/')
            . '/accept-invite?token=' . urlencode($this->invitation->token);

        return (new MailMessage)
            ->subject("You're invited to join {$orgName} on FastLink")
            ->greeting('Hello!')
            ->line("You have been invited to join **{$orgName}** as a {$this->invitation->role}.")
            ->action('Accept invitation', $url)
            ->line('This invitation expires on ' . $this->invitation->expires_at->toDayDateTimeString() . '.')
            ->line('If you did not expect this invitation, you can ignore this email.');
    }
}
