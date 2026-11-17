<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force users with a temporary password to rotate it before continuing.
 *
 * Only the security page and the endpoints required to complete the rotation
 * (password update, 2FA enrolment, passkey management, logout) remain
 * reachable, which prevents a redirect loop.
 */
class EnsurePasswordIsChanged
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
        $user = $request->user();

        if ($user === null || ! $user->must_change_password) {
            return $next($request);
        }

        if ($this->isExempt($request)) {
            return $next($request);
        }

        Inertia::flash('toast', [
            'type' => 'warning',
            'message' => 'You must set a new password before continuing.',
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
