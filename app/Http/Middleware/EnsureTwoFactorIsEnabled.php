<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Require confirmed two-factor authentication for privileged roles.
 *
 * Enforcement is configurable through `config/equb.php`. The security page and
 * the enrolment endpoints stay reachable so a user can satisfy the policy.
 */
class EnsureTwoFactorIsEnabled
{
    /**
     * @var array<int, string>
     */
    private const EXEMPT_PATHS = [
        'settings/security',
        'settings/password',
        'user/*',
        'two-factor-challenge',
        'reset-password/*',
        'forgot-password',
        'logout',
        'email/*',
        'passkeys/*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (! config('equb.security.require_two_factor', true)) {
            return $next($request);
        }

        $user = $request->user();

        if ($user === null || $user->two_factor_confirmed_at !== null) {
            return $next($request);
        }

        $requiredRoles = config('equb.security.two_factor_roles', []);

        if (! is_array($requiredRoles) || array_intersect($requiredRoles, $user->getRoleNames()->all()) === []) {
            return $next($request);
        }

        if ($this->isExempt($request)) {
            return $next($request);
        }

        Inertia::flash('toast', [
            'type' => 'warning',
            'message' => 'Two-factor authentication is required for your role. Enable it to continue.',
        ]);

        return redirect()->route('security.edit');
    }

    private function isExempt(Request $request): bool
    {
        foreach (self::EXEMPT_PATHS as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        return false;
    }
}
