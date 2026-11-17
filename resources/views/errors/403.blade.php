<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Access denied — {{ config('app.name') }}</title>
        <style>
            :root { color-scheme: light dark; }
            * { box-sizing: border-box; }
            body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                padding: 2rem;
                font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
                background: #f8fafc;
                color: #0f172a;
            }
            .card {
                width: 100%;
                max-width: 30rem;
                border: 1px solid #e2e8f0;
                border-radius: 1rem;
                background: #ffffff;
                padding: 2rem;
                box-shadow: 0 20px 45px -30px rgba(15, 23, 42, 0.45);
            }
            .badge {
                display: inline-block;
                border-radius: 9999px;
                background: #fef2f2;
                color: #b91c1c;
                padding: 0.25rem 0.65rem;
                font-size: 0.75rem;
                font-weight: 600;
                letter-spacing: 0.04em;
                text-transform: uppercase;
            }
            h1 { margin: 1rem 0 0.5rem; font-size: 1.5rem; }
            p { margin: 0; color: #475569; line-height: 1.6; }
            .actions { margin-top: 1.75rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
            a, button {
                border-radius: 0.5rem;
                padding: 0.6rem 1rem;
                font-size: 0.875rem;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
            }
            .primary { background: #0f172a; color: #ffffff; border: 1px solid #0f172a; }
            .secondary { background: transparent; color: #0f172a; border: 1px solid #cbd5e1; }
            @media (prefers-color-scheme: dark) {
                body { background: #020617; color: #e2e8f0; }
                .card { background: #0f172a; border-color: #1e293b; }
                p { color: #94a3b8; }
                .badge { background: #450a0a; color: #fecaca; }
                .primary { background: #e2e8f0; color: #0f172a; border-color: #e2e8f0; }
                .secondary { color: #e2e8f0; border-color: #334155; }
            }
        </style>
    </head>
    <body>
        <main class="card">
            <span class="badge">403 — Forbidden</span>
            <h1>You do not have access to this page</h1>
            <p>
                Your account is signed in, but the requested action is outside your
                assigned role or group. If you believe this is a mistake, contact an
                administrator.
            </p>
            <div class="actions">
                @auth
                    <a class="primary" href="{{ route('dashboard') }}">Back to dashboard</a>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button class="secondary" type="submit">Sign out</button>
                    </form>
                @else
                    <a class="primary" href="{{ route('login') }}">Sign in</a>
                @endauth
            </div>
        </main>
    </body>
</html>
