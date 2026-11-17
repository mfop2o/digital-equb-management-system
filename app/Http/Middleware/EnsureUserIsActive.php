<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Invalidate sessions belonging to accounts that are no longer active.
 *
 * Authentication itself rejects inactive accounts, but an account may be
 * deactivated while a session is still open. This middleware closes that gap
 * on the next request.
 */
class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && ! $user->isActive()) {
            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('login')
                ->withErrors([
                    'email' => 'This account is not active. Contact an administrator.',
                ]);
        }

        return $next($request);
    }
}
