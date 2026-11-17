<?php

namespace App\Services;

use App\Enums\UserStatus;
use App\Models\User;
use App\Notifications\UserInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Account provisioning and lifecycle operations.
 *
 * Accounts are always created through an invitation. Administrators never
 * choose another person's password, and accounts are never hard-deleted.
 */
class UserProvisioningService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly AuthorizationService $authorization,
    ) {}

    /**
     * Create an invited account and send the password-setting link.
     *
     * @param  array{name: string, email: string, phone?: string|null}  $attributes
     * @param  array<int, string>  $roleNames
     */
    public function invite(array $attributes, array $roleNames, User $actor): User
    {
        return DB::transaction(function () use ($attributes, $roleNames, $actor): User {
            $target = User::create([
                'name' => $attributes['name'],
                'email' => Str::lower($attributes['email']),
                'phone' => $attributes['phone'] ?? null,
                'password' => Str::password(32),
            ]);

            $target->forceFill([
                'status' => UserStatus::Active,
                'email_verified_at' => null,
                'must_change_password' => true,
            ])->save();

            $this->authorization->syncUserRoles($target, $roleNames, $actor);

            $this->sendInvitation($target, $actor);

            $this->audit->log('user.invited', $target, [], [
                'email' => $target->email,
                'roles' => $target->getRoleNames()->sort()->values()->all(),
            ]);

            return $target;
        });
    }

    /**
     * Update the non-credential account fields.
     *
     * @param  array{name: string, email: string, phone?: string|null}  $attributes
     */
    public function update(User $target, array $attributes): void
    {
        $target->update([
            'name' => $attributes['name'],
            'email' => Str::lower($attributes['email']),
            'phone' => $attributes['phone'] ?? null,
        ]);
    }

    /**
     * Invalidate the existing password and email a fresh one-time link.
     */
    public function resetPassword(User $target, User $actor): void
    {
        DB::transaction(function () use ($target, $actor): void {
            $target->forceFill([
                'password' => Str::password(32),
                'must_change_password' => true,
            ])->save();

            $this->sendInvitation($target, $actor);
        });
    }

    public function deactivate(User $target, ?string $reason = null): void
    {
        $target->deactivate($reason);

        // Close open database sessions immediately when the driver supports it.
        if (Schema::hasTable('sessions')) {
            DB::table('sessions')->where('user_id', $target->id)->delete();
        }
    }

    public function activate(User $target): void
    {
        $target->activate();
    }

    /**
     * Clear a lockout. Suspensions are handled by reactivation instead.
     */
    public function unlock(User $target): void
    {
        if ($target->status !== UserStatus::Locked) {
            throw ValidationException::withMessages([
                'user' => 'Only a locked account can be unlocked.',
            ]);
        }

        $target->forceFill([
            'status' => UserStatus::Active,
            'deactivated_at' => null,
            'deactivation_reason' => null,
        ])->save();
    }

    /**
     * Email a single-use password-setting token.
     */
    public function sendInvitation(User $target, ?User $actor = null): void
    {
        $token = Password::broker()->createToken($target);

        $target->notify(new UserInvitationNotification($token, $actor?->name));

        $this->audit->log('user.invitation_sent', $target, [], [
            'email' => $target->email,
            'requested_by' => $actor?->id,
        ]);
    }
}
