<?php

namespace App\Http\Middleware;

use App\Models\EqubGroupUser;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforce group-scoped authority.
 *
 * The route must expose the group key as `{equb_group}` or `{group}`. A
 * super-admin bypasses the check; everyone else needs an active assignment in
 * `equb_group_user`.
 */
class EnsureGroupAccess
{
    public function handle(Request $request, Closure $next, ?string $parameter = null): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $group = $request->route($parameter ?? 'equb_group')
            ?? $request->route('group');

        if ($group instanceof Model) {
            $group = $group->getKey();
        }

        if (! is_int($group) && ! (is_string($group) && ctype_digit($group))) {
            // No group in the route: nothing to scope.
            return $next($request);
        }

        $allowed = EqubGroupUser::query()
            ->where('equb_group_id', (int) $group)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();

        if (! $allowed) {
            abort(403, 'You are not assigned to this Equb group.');
        }

        return $next($request);
    }
}
