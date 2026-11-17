<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRolePermissionsRequest;
use App\Services\AuthorizationService;
use App\Support\PermissionCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct(private readonly AuthorizationService $authorization) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::query()
            ->withCount(['users', 'permissions'])
            ->orderBy('name')
            ->get()
            ->map(static fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'users_count' => $role->users_count,
                'permissions_count' => $role->permissions_count,
                'is_super_admin' => $role->name === 'super-admin',
            ]);

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'canManagePermissions' => $request->user()?->can('permissions.manage') ?? false,
        ]);
    }

    public function edit(Request $request, Role $role): Response
    {
        $this->authorize('view', $role);

        $assigned = $role->permissions->pluck('name')->all();

        $groups = collect(PermissionCatalog::GROUPED)
            ->map(static fn (array $permissions, string $module): array => [
                'module' => $module,
                'permissions' => array_map(
                    static fn (string $permission): array => [
                        'name' => $permission,
                        'assigned' => in_array($permission, $assigned, true),
                    ],
                    $permissions,
                ),
            ])
            ->values()
            ->all();

        return Inertia::render('admin/roles/edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'is_super_admin' => $role->name === 'super-admin',
            ],
            'groups' => $groups,
            'canManagePermissions' => $this->canManagePermissions($request),
        ]);
    }

    public function update(UpdateRolePermissionsRequest $request, Role $role): RedirectResponse
    {
        $this->authorization->syncRolePermissions(
            $role,
            $request->validated('permissions'),
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Permissions for {$role->name} updated.",
        ]);

        return back();
    }

    private function canManagePermissions(Request $request): bool
    {
        return $request->user()?->can('permissions.manage') ?? false;
    }
}
