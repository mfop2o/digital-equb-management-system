<?php

namespace App\Policies;

use App\Models\User;

/**
 * Account administration rules.
 *
 * Admins may manage ordinary accounts but may never touch a super-admin
 * account, change their own roles, or remove the final super-admin.
 */
class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can('users.view');
    }

    public function view(User $actor, User $target): bool
    {
        return $actor->can('users.view') && $this->mayManage($actor, $target);
    }

    public function create(User $actor): bool
    {
        return $actor->can('users.create');
    }

    public function update(User $actor, User $target): bool
    {
        return $actor->can('users.update') && $this->mayManage($actor, $target);
    }

    public function deactivate(User $actor, User $target): bool
    {
        return $actor->can('users.deactivate')
            && ! $actor->is($target)
            && $this->mayManage($actor, $target)
            && ! $this->isLastSuperAdmin($target);
    }

    public function activate(User $actor, User $target): bool
    {
        return $actor->can('users.deactivate') && $this->mayManage($actor, $target);
    }

    public function unlock(User $actor, User $target): bool
    {
        return $actor->can('users.unlock') && $this->mayManage($actor, $target);
    }

    public function resetPassword(User $actor, User $target): bool
    {
        return $actor->can('users.reset_password') && $this->mayManage($actor, $target);
    }

    public function assignRoles(User $actor, User $target): bool
    {
        return $actor->can('users.assign_roles')
            && ! $actor->is($target)
            && $this->mayManage($actor, $target);
    }

    public function delete(User $actor, User $target): bool
    {
        return false;
    }

    public function restore(User $actor, User $target): bool
    {
        return false;
    }

    public function forceDelete(User $actor, User $target): bool
    {
        return false;
    }

    private function mayManage(User $actor, User $target): bool
    {
        return $actor->isSuperAdmin() || ! $target->hasRole('super-admin');
    }

    private function isLastSuperAdmin(User $target): bool
    {
        return $target->hasRole('super-admin')
            && User::role('super-admin')->count() <= 1;
    }
}
