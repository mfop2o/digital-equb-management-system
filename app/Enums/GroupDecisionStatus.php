<?php

namespace App\Enums;

/**
 * Lifecycle of a member-governance decision.
 */
enum GroupDecisionStatus: string
{
    case Open = 'open';
    case Passed = 'passed';
    case Failed = 'failed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Open',
            self::Passed => 'Passed',
            self::Failed => 'Failed',
            self::Cancelled => 'Cancelled',
        };
    }
}
