<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentType: string
{
    case Deposit = 'deposit';
    case Contribution = 'contribution';
    case Penalty = 'penalty';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Deposit => 'Initial Deposit',
            self::Contribution => 'Regular Contribution',
            self::Penalty => 'Late Penalty',
            self::Other => 'Other Payment',
        };
    }
}
