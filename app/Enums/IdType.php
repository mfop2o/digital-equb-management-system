<?php

namespace App\Enums;

enum IdType: string
{
    case NationalId = 'national_id';
    case KebeleId = 'kebele_id';
    case Passport = 'passport';
    case DriverLicense = 'driver_license';

    public function label(): string
    {
        return match ($this) {
            self::NationalId => 'National Digital ID (ፋይዳ)',
            self::KebeleId => 'Kebele ID (የነዋሪነት መታወቂያ)',
            self::Passport => 'Passport (ፓስፖርት)',
            self::DriverLicense => 'Driver License (መንጃ ፈቃድ)',
        };
    }
}
