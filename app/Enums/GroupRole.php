<?php

namespace App\Enums;

enum GroupRole: string
{
    case Organizer = 'organizer';
    case Treasurer = 'treasurer';
    case Auditor = 'auditor';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::Organizer => 'Equb Organizer',
            self::Treasurer => 'Treasurer',
            self::Auditor => 'Auditor',
            self::Member => 'Equb Member',
        };
    }
}
