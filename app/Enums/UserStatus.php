<?php

namespace App\Enums;

/**
 * Lifecycle state of a user account.
 *
 * This is an access-control state, never a financial state. Financial records
 * reference users by id, so accounts are deactivated rather than deleted.
 */
enum UserStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';
    case Locked = 'locked';

    /**
     * Human-readable label for display.
     */
    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Inactive => 'Deactivated',
            self::Suspended => 'Suspended',
            self::Locked => 'Locked',
        };
    }

    /**
     * Whether an account in this state may authenticate.
     */
    public function allowsAuthentication(): bool
    {
        return $this === self::Active;
    }
}
