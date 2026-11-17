<?php

namespace App\Enums;

enum GroupStatus: string
{
    case Draft = 'draft';
    case Registration = 'registration';
    case DepositStage = 'deposit_stage';
    case Active = 'active';
    case Completed = 'completed';
    case Suspended = 'suspended';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Registration => 'Member Registration',
            self::DepositStage => 'Initial Deposit Stage',
            self::Active => 'Active / Rotating',
            self::Completed => 'Completed',
            self::Suspended => 'Suspended',
            self::Cancelled => 'Cancelled',
        };
    }

    public function badgeVariant(): string
    {
        return match ($this) {
            self::Draft => 'secondary',
            self::Registration => 'outline',
            self::DepositStage => 'warning',
            self::Active => 'success',
            self::Completed => 'default',
            self::Suspended => 'destructive',
            self::Cancelled => 'destructive',
        };
    }
}
