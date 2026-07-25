<?php

namespace App\Notifications;

use App\Models\OrganizationInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Queued: requires a running queue worker to deliver invitation emails.
 */
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
        $invitation = $this->invitation->relationLoaded('organization')
            ? $this->invitation
            : $this->invitation->load('organization');

        $orgName = $invitation->organization?->name ?? 'an organization';
        $frontend = rtrim((string) config('app.frontend_login_url', config('app.url')), '/');
        $url = $frontend . '/accept-invite?token=' . urlencode($invitation->token);

        return (new MailMessage)
            ->subject("You're invited to join {$orgName} on FastLink")
            ->greeting('Hello!')
            ->line("You have been invited to join **{$orgName}** as a {$invitation->role}.")
            ->action('Accept invitation', $url)
            ->line('This invitation expires on ' . $invitation->expires_at->toDayDateTimeString() . '.')
            ->line('If you did not expect this invitation, you can ignore this email.');
    }
}
