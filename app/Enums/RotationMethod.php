<?php

namespace App\Enums;

enum RotationMethod: string
{
    case Predetermined = 'predetermined';
    case Lottery = 'lottery';
    case Committee = 'committee';

    public function label(): string
    {
        return match ($this) {
            self::Predetermined => 'Predetermined Fixed Order (ቀድሞ የተወሰነ ቅደም ተከተል)',
            self::Lottery => 'Lottery Draw (ዕጣ)',
            self::Committee => 'Committee Selection (በኮሚቴ ምርጫ)',
        };
    }
}
