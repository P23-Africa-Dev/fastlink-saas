<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Task $task,
        private readonly User $assignedBy
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
        $projectName = $this->task->project?->name ?? 'N/A';
        $dueDate = $this->task->due_date ? $this->task->due_date->toDateString() : 'Not set';

        return (new MailMessage)
            ->subject("New task assigned: {$this->task->title}")
            ->greeting("Hello {$notifiable->name},")
            ->line("You have been assigned a new task by {$this->assignedBy->name}.")
            ->line("Task: {$this->task->title}")
            ->line("Project: {$projectName}")
            ->line("Priority: " . strtoupper((string) $this->task->priority))
            ->line("Due Date: {$dueDate}")
            ->action('Open FastLink', $loginUrl)
            ->line('Please review the task details in your dashboard.');
    }
}
