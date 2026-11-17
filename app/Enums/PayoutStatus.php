<?php

declare(strict_types=1);

namespace App\Enums;

enum PayoutStatus: string
{
    case Scheduled = 'scheduled';
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';
    case Disbursed = 'disbursed';
    /**
     * Completed = final immutable terminal state.
     * Business rule (confirmed): A payout becomes PAID only after actual disbursement is recorded.
     * BLUE member status is set only at Disbursed or Completed — NEVER at Approved.
     */
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Reversed = 'reversed';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Scheduled',
            self::PendingApproval => 'Pending Approval',
            self::Approved => 'Approved (Ready to Disburse)',
            self::Disbursed => 'Disbursed',
            self::Completed => 'Completed (Paid)',
            self::Cancelled => 'Cancelled',
            self::Reversed => 'Reversed',
        };
    }

    /** Returns true if the payout counts as "received" for BLUE status classification. */
    public function isConsideredPaid(): bool
    {
        return match ($this) {
            self::Disbursed, self::Completed => true,
            default => false,
        };
    }
}
