<?php

namespace App\Enums;

/**
 * How a group admits new members, configured in the group rules.
 *
 * - ApprovalRequired: a membership request is created and a group
 *   organizer/approver reviews it.
 * - AutoAdmit: eligible requests become active members immediately (capacity
 *   and duplicate checks still apply).
 */
enum MembershipMode: string
{
    case ApprovalRequired = 'approval_required';
    case AutoAdmit = 'auto_admit';

    public function label(): string
    {
        return match ($this) {
            self::ApprovalRequired => 'Approval Required',
            self::AutoAdmit => 'Automatic Admission',
        };
    }
}
