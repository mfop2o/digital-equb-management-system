<?php

namespace App\Policies;

use App\Models\User;

/**
 * System settings are readable by administrators and writable only by
 * super-admins in the default grant matrix.
 */
class SettingPolicy
{
    public function view(User $actor): bool
    {
        return $actor->can('settings.view');
    }

    public function update(User $actor): bool
    {
        return $actor->can('settings.update');
    }
}
