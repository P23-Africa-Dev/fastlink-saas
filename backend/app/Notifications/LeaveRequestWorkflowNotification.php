<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveRequestWorkflowNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly LeaveRequest $leaveRequest,
        private readonly User $actor,
        private readonly string $event,
        private readonly ?string $extraNote = null,
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
        $title = $this->subjectForEvent($this->event);
        $startDate = $this->leaveRequest->start_date?->toDateString() ?? (string) $this->leaveRequest->start_date;
        $endDate = $this->leaveRequest->end_date?->toDateString() ?? (string) $this->leaveRequest->end_date;

        $mail = (new MailMessage)
            ->subject($title)
            ->greeting("Hello {$notifiable->name},")
            ->line("Leave request #{$this->leaveRequest->id} has a new update.")
            ->line("Event: {$this->humanEvent($this->event)}")
            ->line("Requested By: {$this->leaveRequest->user?->name}")
            ->line("Type: " . strtoupper((string) $this->leaveRequest->type))
            ->line("Date Range: {$startDate} to {$endDate}")
            ->line("Current Status: " . strtoupper((string) $this->leaveRequest->status))
            ->line("Action By: {$this->actor->name}")
            ->action('Open FastLink', $loginUrl);

        if ($this->extraNote) {
            $mail->line("Note: {$this->extraNote}");
        }

        return $mail->line('Please review the leave request in your dashboard.');
    }

    private function subjectForEvent(string $event): string
    {
        return match ($event) {
            'created' => 'New leave request submitted',
            'updated' => 'Leave request updated',
            'cancelled' => 'Leave request cancelled',
            'approved' => 'Leave request approved',
            'rejected' => 'Leave request rejected',
            'modified' => 'Leave request modified by supervisor/admin',
            'sender_okay' => 'Leave modification accepted by requester',
            'sender_not_okay' => 'Leave modification declined by requester',
            default => 'Leave request updated',
        };
    }

    private function humanEvent(string $event): string
    {
        return str_replace('_', ' ', ucfirst($event));
    }
}
