<?php

namespace App\Enums;

enum ContributionFrequency: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Biweekly = 'biweekly';
    case Monthly = 'monthly';

    public function label(): string
    {
        return match ($this) {
            self::Daily => 'Daily (በየቀኑ)',
            self::Weekly => 'Weekly (በየሳምንቱ)',
            self::Biweekly => 'Bi-Weekly (በየሁለት ሳምንቱ)',
            self::Monthly => 'Monthly (በየወሩ)',
        };
    }
}
