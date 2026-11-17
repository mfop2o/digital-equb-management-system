<?php

namespace App\Enums;

/**
 * Kind of member-governance decision.
 */
enum GroupDecisionType: string
{
    /**
     * A general motion put to the group (schedules, social decisions, etc.).
     */
    case General = 'general';

    /**
     * A proposal to change the group rules. While the group is operating
     * (deposit stage / active), an approved decision of this kind is the only
     * way a new rule version may be configured.
     */
    case RuleChange = 'rule_change';

    public function label(): string
    {
        return match ($this) {
            self::General => 'General Decision',
            self::RuleChange => 'Rule Change',
        };
    }
}
