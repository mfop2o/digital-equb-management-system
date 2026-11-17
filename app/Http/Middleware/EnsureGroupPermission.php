<?php

namespace App\Http\Middleware;

use App\Models\EqubGroup;
use App\Models\User;
use App\Support\PermissionCatalog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Group-aware permission check.
 *
 * A permission is satisfied when the user holds it globally (Spatie) OR when
 * they hold an active group-scoped staff role on the routed group whose
 * catalog grant list contains the permission. This is what lets a self-service
 * organizer operate their own group without any global staff role.
 *
 * Usage: `->middleware('group.permission:contributions.record')`
 * The routed group is expected under the `{group}` parameter.
 */
class EnsureGroupPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $group = $request->route('group');

        if (! $group instanceof EqubGroup) {
            abort(403, 'This action requires a group context.');
        }

        foreach ($permissions as $permission) {
            if ($user->can($permission)) {
                continue;
            }

            if (! $this->hasGroupPermission($user, $group, $permission)) {
                abort(403, "You do not have permission '{$permission}' in this group.");
            }
        }

        return $next($request);
    }

    /**
     * Whether the user's active staff role on the group grants the permission.
     */
    protected function hasGroupPermission(User $user, EqubGroup $group, string $permission): bool
    {
        $role = $group->staffUsers()
            ->where('users.id', $user->id)
            ->wherePivot('is_active', true)
            ->limit(1)
            ->value('role');

        if (! $role) {
            return false;
        }

        return in_array($permission, PermissionCatalog::ROLE_PERMISSIONS[$role] ?? [], true);
    }
}
