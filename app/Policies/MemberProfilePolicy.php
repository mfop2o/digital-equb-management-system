<?php

namespace App\Policies;

use App\Models\MemberProfile;
use App\Models\User;

class MemberProfilePolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('members.view');
    }

    public function view(User $user, MemberProfile $profile): bool
    {
        if ($user->can('members.view')) {
            return true;
        }

        return $profile->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('members.create');
    }

    public function update(User $user, MemberProfile $profile): bool
    {
        return $user->can('members.update');
    }

    public function verify(User $user, MemberProfile $profile): bool
    {
        return $user->can('members.verify');
    }

    public function delete(User $user, MemberProfile $profile): bool
    {
        return $user->can('members.deactivate');
    }
}
