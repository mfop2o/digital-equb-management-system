<?php

namespace Database\Seeders;

use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Idempotent baseline roles and permissions.
 *
 * This seeder only adds. It never removes a permission that an administrator
 * granted at runtime, so a redeploy cannot silently weaken access.
 */
class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Six stable operational roles.
     *
     * @var array<int, string>
     */
    private const ROLES = [
        'super-admin',
        'admin',
        'organizer',
        'treasurer',
        'auditor',
        'member',
    ];

    /**
     * Role to permission mapping.
     *
     * @var array<string, array<int, string>>
     */
    private const ROLE_PERMISSIONS = PermissionCatalog::ROLE_PERMISSIONS;

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = 'web';

        foreach (self::ROLES as $roleName) {
            Role::findOrCreate($roleName, $guard);
        }

        $permissionModels = $this->syncPermissions($guard);

        Role::findByName('super-admin', $guard)
            ->givePermissionTo(array_values($permissionModels));

        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            $granted = array_map(
                fn (string $permission) => $permissionModels[$permission],
                $permissions,
            );

            Role::findByName($roleName, $guard)->givePermissionTo($granted);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Find or create every catalog permission and return them keyed by name.
     *
     * @return array<string, \Spatie\Permission\Contracts\Permission>
     */
    private function syncPermissions(string $guard): array
    {
        $permissions = [];

        foreach (PermissionCatalog::GROUPED as $group) {
            foreach ($group as $permission) {
                $permissions[$permission] = Permission::findOrCreate($permission, $guard);
            }
        }

        return $permissions;
    }

    /**
     * All permission names, for tests and command output.
     *
     * @return array<int, string>
     */
    public static function permissionNames(): array
    {
        return PermissionCatalog::names();
    }

    /**
     * Role names in seeding order.
     *
     * @return array<int, string>
     */
    public static function roleNames(): array
    {
        return self::ROLES;
    }
}
