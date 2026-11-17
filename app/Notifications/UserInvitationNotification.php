<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Invitation and administrator-triggered password reset.
 *
 * The email contains a single-use password reset link. No password is ever
 * sent over email. Delivery is queued so a slow mail server cannot block the
 * administration request.
 */
class UserInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $token,
        public readonly ?string $invitedBy = null,
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
        $url = route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable instanceof User ? $notifiable->email : null,
        ]);

        $message = (new MailMessage)
            ->subject('Set your password for '.config('app.name'))
            ->greeting('Welcome')
            ->line('An account has been prepared for you on the Equb management system.')
            ->action('Set your password', $url)
            ->line('This link can be used once and will expire. If you were not expecting this email, contact your administrator.');

        if ($this->invitedBy !== null) {
            $message->line('Invited by: '.$this->invitedBy);
        }

        return $message;
    }
}
