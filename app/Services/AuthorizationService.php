<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Authorization mutations with explicit guard rails and audit trails.
 *
 * Controllers still authorize the action through policies. This service adds
 * the invariants that must hold regardless of the caller: no self-escalation,
 * no admin-controlled super-admin grant, and no removal of the final
 * super-admin.
 */
class AuthorizationService
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Replace a user's global roles.
     *
     * @param  array<int, string>  $roleNames
     */
    public function syncUserRoles(User $target, array $roleNames, User $actor): void
    {
        $roleNames = $this->normalizeNames($roleNames);
        $currentNames = $target->getRoleNames()->sort()->values()->all();

        if ($target->is($actor)) {
            throw ValidationException::withMessages([
                'roles' => 'You cannot change your own roles.',
            ]);
        }

        if (! $actor->isSuperAdmin()) {
            if (in_array('super-admin', $roleNames, true) || in_array('super-admin', $currentNames, true)) {
                throw ValidationException::withMessages([
                    'roles' => 'Only a super administrator can assign or revoke the super-admin role.',
                ]);
            }
        }

        $roles = Role::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $roleNames)
            ->get();

        if ($roles->count() !== count($roleNames)) {
            throw ValidationException::withMessages([
                'roles' => 'One or more selected roles do not exist.',
            ]);
        }

        if (in_array('super-admin', $currentNames, true) && ! in_array('super-admin', $roleNames, true)) {
            if (User::role('super-admin')->count() <= 1) {
                throw ValidationException::withMessages([
                    'roles' => 'The final super administrator cannot lose that role.',
                ]);
            }
        }

        $target->syncRoles($roles);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Replace the permissions attached to a role with minimal add/remove work.
     *
     * @param  array<int, string>  $permissionNames
     */
    public function syncRolePermissions(Role $role, array $permissionNames, User $actor): void
    {
        $permissionNames = $this->normalizeNames($permissionNames);

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $permissionNames)
            ->get();

        if ($permissions->count() !== count($permissionNames)) {
            throw ValidationException::withMessages([
                'permissions' => 'One or more selected permissions do not exist.',
            ]);
        }

        $before = $role->permissions->pluck('name')->sort()->values()->all();

        DB::transaction(function () use ($role, $before, $permissionNames, $actor): void {
            $toAttach = array_values(array_diff($permissionNames, $before));
            $toDetach = array_values(array_diff($before, $permissionNames));

            if ($toDetach !== []) {
                $role->revokePermissionTo($toDetach);
            }

            if ($toAttach !== []) {
                $role->givePermissionTo($toAttach);
            }

            $after = $role->permissions()->pluck('name')->sort()->values()->all();

            if ($before !== $after) {
                $this->audit->log('role.permissions_synced', $role, [
                    'permissions' => $before,
                ], [
                    'permissions' => $after,
                    'changed_by' => $actor->id,
                ]);
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $role->unsetRelation('permissions');
    }

    /**
     * @param  array<int, mixed>  $names
     * @return array<int, string>
     */
    private function normalizeNames(array $names): array
    {
        return collect($names)
            ->filter(fn ($name): bool => is_string($name) && $name !== '')
            ->map(fn (string $name): string => trim($name))
            ->unique()
            ->sort()
            ->values()
            ->all();
    }
}
