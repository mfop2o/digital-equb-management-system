<?php

namespace App\Enums;

/**
 * Initial deposit treatment — what happens to accumulated initial deposits.
 *
 * CONFIRMED: Deposits are accumulated, retained, and kept separate from
 * regular contributions and payout funds.
 *
 * Ownership, refundability, and any later use of retained deposits remain
 * PENDING business decisions. The system must not assume a distribution policy.
 *
 * Legacy values (organizer_compensation etc.) are preserved so existing DB
 * rows never throw a ValueError.
 */
enum InitialDepositTreatment: string
{
    /** Confirmed current behaviour — deposits retained, disposition TBD */
    case Retained = 'retained';

    /** Legacy / existing DB value — organizers are remunerated from deposits */
    case OrganizerCompensation = 'organizer_compensation';

    /** Reserve fund held by the group */
    case ReserveFund = 'reserve_fund';

    /** Pooled into the first payout pot */
    case PooledFirstPayout = 'pooled_first_payout';

    /** Refunded to members at cycle end */
    case RefundAtEnd = 'refund_at_end';

    public function label(): string
    {
        return match ($this) {
            self::Retained => 'Retained (distribution policy pending)',
            self::OrganizerCompensation => 'Organizer Compensation (ዳኛ Remuneration — D-01B)',
            self::ReserveFund => 'Reserve Fund',
            self::PooledFirstPayout => 'Pooled into First Payout',
            self::RefundAtEnd => 'Refunded at Cycle End',
        };
    }
}
