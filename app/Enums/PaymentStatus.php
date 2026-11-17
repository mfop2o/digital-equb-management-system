<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentStatus: string
{
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case Verified = 'verified';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
    case Reversed = 'reversed';

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Submitted',
            self::UnderReview => 'Under Review',
            self::Verified => 'Verified',
            self::Rejected => 'Rejected',
            self::Cancelled => 'Cancelled',
            self::Reversed => 'Reversed',
        };
    }
}
