<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Spatie\Permission\Models\Permission;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $isSuperAdmin = $user?->isSuperAdmin() ?? false;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'logo_url' => asset('assets/logo.png') . '?v=' . (file_exists(public_path('assets/logo.png')) ? filemtime(public_path('assets/logo.png')) : time()),
            'auth' => [
                'user' => $user,
                'roles' => $user?->getRoleNames()->sort()->values()->all() ?? [],
                'permissions' => $user === null
                    ? []
                    : ($isSuperAdmin
                        ? Permission::query()->pluck('name')->sort()->values()->all()
                        : $user->getAllPermissions()->pluck('name')->sort()->values()->all()),
                'is_super_admin' => $isSuperAdmin,
                'is_auditor' => $user?->isAuditor() ?? false,
                'must_change_password' => $user === null ? false : $user->must_change_password,
                'two_factor_enabled' => $user !== null && $user->two_factor_confirmed_at !== null,
            ],
            'organization' => [
                'name' => config('app.name'),
                'timezone' => config('equb.display_timezone'),
                'currency' => config('equb.currency'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
