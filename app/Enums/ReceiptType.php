<?php

declare(strict_types=1);

namespace App\Enums;

enum ReceiptType: string
{
    case Payment = 'payment';
    case Payout = 'payout';
    case Refund = 'refund';

    public function label(): string
    {
        return match ($this) {
            self::Payment => 'Payment Receipt',
            self::Payout => 'Payout Disbursement Receipt',
            self::Refund => 'Refund Receipt',
        };
    }
}
