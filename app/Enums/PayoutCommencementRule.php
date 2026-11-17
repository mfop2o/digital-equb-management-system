<?php

namespace App\Enums;

enum PayoutCommencementRule: string
{
    case DepositCompletionAndDate = 'deposit_completion_and_date';
    case DepositCompletionOnly = 'deposit_completion_only';
    case ScheduledDateOnly = 'scheduled_date_only';
    case ManualAdminApproval = 'manual_admin_approval';

    public function label(): string
    {
        return match ($this) {
            self::DepositCompletionAndDate => 'Deposits Verified + Scheduled Date Reached + Approval',
            self::DepositCompletionOnly => 'All Initial Deposit Rounds Completed & Verified',
            self::ScheduledDateOnly => 'Configured Payout Date Reached',
            self::ManualAdminApproval => 'Manual Admin / Organizer Authorization Only',
        };
    }
}
