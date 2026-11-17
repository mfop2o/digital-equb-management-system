<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Permission;

/**
 * The permission catalog itself is immutable at runtime.
 */
class PermissionPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can('permissions.manage');
    }

    public function view(User $actor, Permission $permission): bool
    {
        return $actor->can('permissions.manage');
    }

    public function create(User $actor): bool
    {
        return false;
    }

    public function update(User $actor, Permission $permission): bool
    {
        return false;
    }

    public function delete(User $actor, Permission $permission): bool
    {
        return false;
    }
}
