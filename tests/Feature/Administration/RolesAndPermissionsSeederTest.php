<?php

namespace Tests\Feature\Administration;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RolesAndPermissionsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_creates_the_six_roles()
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->assertEqualsCanonicalizing(
            RolesAndPermissionsSeeder::roleNames(),
            Role::query()->pluck('name')->all(),
        );
    }

    public function test_seeder_is_idempotent()
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $roles = Role::count();
        $permissions = Permission::count();
        $rolePermissions = \DB::table('role_has_permissions')->count();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->assertSame($roles, Role::count());
        $this->assertSame($permissions, Permission::count());
        $this->assertSame($rolePermissions, \DB::table('role_has_permissions')->count());
    }

    public function test_super_admin_receives_the_full_permission_catalog()
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $superAdmin = Role::findByName('super-admin');

        $this->assertEqualsCanonicalizing(
            RolesAndPermissionsSeeder::permissionNames(),
            $superAdmin->permissions->pluck('name')->all(),
        );
    }

    public function test_auditor_is_read_only()
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $auditor = User::factory()->create();
        $auditor->assignRole('auditor');

        $this->assertTrue($auditor->can('audit.view'));
        $this->assertTrue($auditor->can('payments.view'));
        $this->assertFalse($auditor->can('payments.verify'));
        $this->assertFalse($auditor->can('payouts.disburse'));
        $this->assertFalse($auditor->can('settings.update'));
    }

    public function test_treasurer_can_verify_but_not_approve_payouts()
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $treasurer = User::factory()->create();
        $treasurer->assignRole('treasurer');

        $this->assertTrue($treasurer->can('payments.verify'));
        $this->assertTrue($treasurer->can('payouts.disburse'));
        $this->assertFalse($treasurer->can('payouts.approve'));
    }
}
