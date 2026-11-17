<?php

namespace App\Enums;

enum MembershipStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Suspended = 'suspended';
    case Withdrawn = 'withdrawn';
    case Expelled = 'expelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending Approval',
            self::Active => 'Active Member',
            self::Suspended => 'Suspended',
            self::Withdrawn => 'Withdrawn',
            self::Expelled => 'Expelled',
        };
    }
}
