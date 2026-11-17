<?php

namespace App\Enums;

/**
 * Discovery visibility of an Equb group.
 *
 * - Public: listed on the explore page; anyone can find it and request to join.
 * - Private: hidden from discovery; joinable only through an invite code.
 * - Invite-only: hidden from discovery AND joinable only via invite code.
 *   (Functionally identical to private today; kept distinct so a future
 *   member-nominated invitation flow can differ without a migration.)
 */
enum GroupVisibility: string
{
    case Public = 'public';
    case Private = 'private';
    case InviteOnly = 'invite_only';

    public function label(): string
    {
        return match ($this) {
            self::Public => 'Public',
            self::Private => 'Private',
            self::InviteOnly => 'Invite Only',
        };
    }

    /**
     * Whether the group may be listed on the public explore page.
     */
    public function isListed(): bool
    {
        return $this === self::Public;
    }

    /**
     * Whether the group accepts join requests without an invite code.
     */
    public function acceptsOpenRequests(): bool
    {
        return $this === self::Public;
    }
}
