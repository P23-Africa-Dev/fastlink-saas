<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserAccountCreatedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $temporaryPassword) {}

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

        return (new MailMessage)
            ->subject('Your FastLink account has been created')
            ->greeting("Hello {$notifiable->name},")
            ->line('A FastLink account has been created for you by an administrator/supervisor.')
            ->line("Login Page: {$loginUrl}")
            ->line("Login Email: {$notifiable->email}")
            ->line("Temporary Password: {$this->temporaryPassword}")
            ->action('Open Login Page', $loginUrl)
            ->line('For security, please sign in and change your password as soon as possible.');
    }
}
