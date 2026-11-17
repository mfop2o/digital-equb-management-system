<?php

namespace App\Policies;

use App\Models\EqubGroup;
use App\Models\User;

class EqubGroupPolicy
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
        return $user->can('groups.view');
    }

    public function view(User $user, EqubGroup $group): bool
    {
        if ($user->can('groups.view')) {
            return true;
        }

        return $user->hasGroupAccess($group->id);
    }

    public function create(User $user): bool
    {
        return $user->can('groups.create');
    }

    public function update(User $user, EqubGroup $group): bool
    {
        if ($user->can('groups.update')) {
            return true;
        }

        return $user->hasGroupAccess($group->id);
    }

    public function configureRules(User $user, EqubGroup $group): bool
    {
        if ($user->can('rules.configure')) {
            return true;
        }

        return $user->hasGroupAccess($group->id);
    }

    public function enrollMembers(User $user, EqubGroup $group): bool
    {
        if ($user->can('memberships.approve')) {
            return true;
        }

        return $user->hasGroupAccess($group->id);
    }

    public function activate(User $user, EqubGroup $group): bool
    {
        return $user->can('groups.activate');
    }
}
