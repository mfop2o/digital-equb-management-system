<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Permission::class);

        $permissions = Permission::query()
            ->with('roles:id,name')
            ->get()
            ->keyBy('name');

        $groups = collect(PermissionCatalog::GROUPED)
            ->map(static function (array $names, string $module) use ($permissions): array {
                return [
                    'module' => $module,
                    'permissions' => array_map(
                        static function (string $name) use ($permissions): array {
                            $permission = $permissions->get($name);

                            return [
                                'name' => $name,
                                'roles' => $permission === null
                                    ? []
                                    : $permission->roles->pluck('name')->sort()->values()->all(),
                            ];
                        },
                        $names,
                    ),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('admin/permissions/index', [
            'groups' => $groups,
            'canManagePermissions' => $request->user()?->can('permissions.manage') ?? false,
        ]);
    }
}
