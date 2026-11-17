<?php

namespace App\Enums;

enum MemberStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';
    case Blacklisted = 'blacklisted';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Inactive => 'Inactive',
            self::Suspended => 'Suspended',
            self::Blacklisted => 'Blacklisted',
        };
    }
}
