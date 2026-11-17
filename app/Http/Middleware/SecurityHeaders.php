<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Baseline security response headers.
 *
 * The Content-Security-Policy is report-only so it cannot break the
 * Inertia/Vite runtime while the policy is tuned. It will be enforced
 * in the production hardening phase.
 *
 * In local development the Vite HMR server runs on a separate origin
 * (default: http://localhost:5173 / http://[::1]:5173). Those origins
 * are added to every relevant CSP directive automatically when APP_ENV
 * is not production.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');

        if (! $response->headers->has('Content-Security-Policy-Report-Only')) {
            $response->headers->set(
                'Content-Security-Policy-Report-Only',
                $this->buildCsp(),
            );
        }

        return $response;
    }

    private function buildCsp(): string
    {
        $isDev = ! app()->isProduction();

        // Vite dev-server origin — configurable via VITE_DEV_SERVER_URL, defaults to localhost:5173.
        // CSP does NOT accept IPv6 bracket notation (http://[::1]:5173 is invalid as a CSP source).
        // Using localhost:5173 covers both 127.0.0.1 and ::1 since Vite binds to localhost.
        $viteHttp = 'http://localhost:5173';
        $viteWs = 'ws://localhost:5173';

        // Optionally override via config/env
        $configured = config('app.vite_dev_server_url');
        if ($configured && $isDev) {
            // Strip any trailing slash; CSP sources must not end with /
            $viteHttp = rtrim($configured, '/');
            $viteWs = str_replace(['http://', 'https://'], ['ws://', 'wss://'], $viteHttp);
        }

        $devSrc = $isDev ? " {$viteHttp}" : '';
        $wsDevSrc = $isDev ? " {$viteWs}" : '';

        $directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'{$devSrc}",
            "style-src 'self' 'unsafe-inline'{$devSrc}",
            "img-src 'self' data: blob:",
            "font-src 'self' data:{$devSrc}",
            "connect-src 'self' ws: wss:{$wsDevSrc}{$devSrc}",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        return implode('; ', $directives);
    }
}
