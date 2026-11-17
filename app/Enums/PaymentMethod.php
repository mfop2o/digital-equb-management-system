<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentMethod: string
{
    case BankTransfer = 'bank_transfer';
    case MobileMoney = 'mobile_money';
    case Cash = 'cash';
    case Cheque = 'cheque';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::BankTransfer => 'Bank Transfer (CBE, Awash, etc.)',
            self::MobileMoney => 'Mobile Money (Telebirr, CBE Birr)',
            self::Cash => 'Cash on Hand',
            self::Cheque => 'Cheque',
            self::Other => 'Other',
        };
    }
}
