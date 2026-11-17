<?php

declare(strict_types=1);

namespace App\Enums;

enum DepositRoundStatus: string
{
    case Pending = 'pending';
    case Open = 'open';
    case Closed = 'closed';
    case Approved = 'approved';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Open => 'Open',
            self::Closed => 'Closed',
            self::Approved => 'Approved',
            self::Cancelled => 'Cancelled',
        };
    }
}
