<?php

namespace App\Enums;

enum MemberColor: string
{
    case Green = 'green';
    case Red = 'red';
    case Blue = 'blue';

    public function label(): string
    {
        return match ($this) {
            self::Green => 'Paid & Eligible',
            self::Red => 'Unpaid / Pending',
            self::Blue => 'Equb Received',
        };
    }

    public function hexColor(): string
    {
        return match ($this) {
            self::Green => '#16a34a', // green-600
            self::Red => '#dc2626',   // red-600
            self::Blue => '#2563eb',  // blue-600
        };
    }
}
