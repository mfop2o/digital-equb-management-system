<?php

namespace App\Observers;

use App\Models\User;
use App\Services\AuditService;

/**
 * Audit user lifecycle changes.
 *
 * Password hashes, remember tokens, and 2FA secrets are never written to the
 * audit trail. A boolean marker records that a credential changed instead.
 */
class UserObserver
{
    /**
     * Fields that must never appear in audit payloads.
     *
     * @var array<int, string>
     */
    private const SENSITIVE = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Fields too noisy to audit individually (login is audited separately).
     *
     * @var array<int, string>
     */
    private const IGNORED = [
        'last_login_at',
        'updated_at',
    ];

    public function __construct(private readonly AuditService $audit) {}

    public function created(User $user): void
    {
        $this->audit->log('user.created', $user, [], [
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status->value,
        ]);
    }

    public function updated(User $user): void
    {
        $changed = array_values(array_diff(array_keys($user->getChanges()), self::SENSITIVE, self::IGNORED));
        $passwordChanged = $user->wasChanged('password');

        if ($changed !== []) {
            $before = [];
            $after = [];

            foreach ($changed as $field) {
                $before[$field] = $user->getOriginal($field);
                $after[$field] = $user->getAttribute($field);
            }

            $this->audit->log('user.updated', $user, $before, $after);
        }

        if ($passwordChanged) {
            // Record only that the credential changed, never the hash itself.
            $this->audit->log('user.password_changed', $user);
        }
    }

    public function deleted(User $user): void
    {
        // Users should never be hard-deleted. Record it loudly if it happens.
        $this->audit->log('user.deleted', $user, [
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }
}
