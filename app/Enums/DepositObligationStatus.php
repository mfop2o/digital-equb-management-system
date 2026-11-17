<?php

declare(strict_types=1);

namespace App\Enums;

enum DepositObligationStatus: string
{
    case Pending = 'pending';
    case Submitted = 'submitted';
    case Verified = 'verified';
    case Overdue = 'overdue';
    case Exempt = 'exempt';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Submitted => 'Submitted (Under Review)',
            self::Verified => 'Verified & Paid',
            self::Overdue => 'Overdue',
            self::Exempt => 'Exempt (no amount due)',
        };
    }

    public function badgeVariant(): string
    {
        return match ($this) {
            self::Verified => 'success',
            self::Submitted => 'info',
            self::Pending => 'warning',
            self::Overdue => 'danger',
            self::Exempt => 'secondary',
        };
    }
}
