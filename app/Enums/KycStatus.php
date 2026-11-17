<?php

namespace App\Enums;

enum KycStatus: string
{
    case Unverified = 'unverified';
    case Pending = 'pending';
    case Verified = 'verified';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Unverified => 'Unverified',
            self::Pending => 'Pending Verification',
            self::Verified => 'KYC Verified',
            self::Rejected => 'Verification Rejected',
        };
    }
}
