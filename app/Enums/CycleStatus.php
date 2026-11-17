<?php

declare(strict_types=1);

namespace App\Enums;

enum CycleStatus: string
{
    case Planned = 'planned';
    case DepositStage = 'deposit_stage';
    case Ready = 'ready';
    case Active = 'active';
    case Closing = 'closing';
    case Closed = 'closed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Planned => 'Planned',
            self::DepositStage => 'Deposit Stage',
            self::Ready => 'Ready for Activation',
            self::Active => 'Active',
            self::Closing => 'Closing',
            self::Closed => 'Closed',
            self::Cancelled => 'Cancelled',
        };
    }
}
