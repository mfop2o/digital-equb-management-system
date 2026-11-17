<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

/**
 * Roles are a fixed operational set; only their permissions are editable.
 */
class RolePolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can('roles.view');
    }

    public function view(User $actor, Role $role): bool
    {
        return $actor->can('roles.view');
    }

    public function create(User $actor): bool
    {
        return false;
    }

    public function update(User $actor, Role $role): bool
    {
        return $actor->can('roles.manage');
    }

    public function syncPermissions(User $actor, Role $role): bool
    {
        return $actor->can('permissions.manage');
    }

    public function delete(User $actor, Role $role): bool
    {
        return false;
    }
}
