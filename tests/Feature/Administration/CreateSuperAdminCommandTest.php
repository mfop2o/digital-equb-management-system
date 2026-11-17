<?php

namespace Tests\Feature\Administration;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateSuperAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_it_creates_a_verified_super_administrator()
    {
        $this->artisan('equb:create-admin', [
            '--name' => 'System Owner',
            '--email' => 'owner@example.com',
            '--password' => 'Str0ng!Password123',
            '--no-force-change' => true,
        ])->assertExitCode(0);

        $user = User::query()->where('email', 'owner@example.com')->firstOrFail();

        $this->assertTrue($user->hasRole('super-admin'));
        $this->assertNotNull($user->email_verified_at);
        $this->assertFalse($user->must_change_password);
    }

    public function test_it_forces_a_password_change_by_default()
    {
        $this->artisan('equb:create-admin', [
            '--name' => 'System Owner',
            '--email' => 'owner@example.com',
            '--password' => 'Str0ng!Password123',
        ])->assertExitCode(0);

        $this->assertTrue(
            User::query()->where('email', 'owner@example.com')->firstOrFail()->must_change_password,
        );
    }

    public function test_it_rejects_a_duplicate_email()
    {
        User::factory()->create(['email' => 'owner@example.com']);

        $this->artisan('equb:create-admin', [
            '--name' => 'System Owner',
            '--email' => 'owner@example.com',
            '--password' => 'Str0ng!Password123',
        ])->assertExitCode(1);
    }

    public function test_it_rejects_a_weak_password()
    {
        $this->artisan('equb:create-admin', [
            '--name' => 'System Owner',
            '--email' => 'owner@example.com',
            '--password' => 'password',
        ])->assertExitCode(1);

        $this->assertDatabaseMissing('users', ['email' => 'owner@example.com']);
    }
}
