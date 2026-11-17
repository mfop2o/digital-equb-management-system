<?php

namespace Tests\Feature\Auth;

use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Public self-registration: visitors create their own member account with a
 * linked member profile and the `member` role.
 */
class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_is_available(): void
    {
        $response = $this->get('/register');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('auth/register'));
    }

    public function test_new_users_can_register_publicly(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $response = $this->post('/register', [
            'first_name' => 'Test',
            'middle_name' => 'Middle',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'phone' => '0912345678',
            'password' => 'password',
            'password_confirmation' => 'password',
            'terms' => '1',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        // When unverified user visits dashboard, they are redirected to verification notice
        $dashResponse = $this->get('/dashboard');
        $dashResponse->assertRedirect(route('verification.notice', absolute: false));

        $user = User::where('email', 'test@example.com')->first();

        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('member'));
        $this->assertFalse((bool) $user->hasVerifiedEmail());

        $profile = MemberProfile::where('user_id', $user->id)->first();
        $this->assertNotNull($profile);
        $this->assertSame('Test', $profile->first_name);
        $this->assertSame('Test Middle User', $user->name);
    }

    public function test_registration_requires_unique_email_and_phone(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        User::factory()->create(['email' => 'taken@example.com', 'phone' => '0912345678']);

        $response = $this->post('/register', [
            'first_name' => 'Test',
            'middle_name' => 'Middle',
            'last_name' => 'User',
            'email' => 'taken@example.com',
            'phone' => '0912345678',
            'password' => 'password',
            'password_confirmation' => 'password',
            'terms' => '1',
        ]);

        $response->assertSessionHasErrors(['email', 'phone']);
        $this->assertGuest();
    }

    public function test_registration_requires_accepting_terms(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $response = $this->post('/register', [
            'first_name' => 'Test',
            'middle_name' => 'Middle',
            'last_name' => 'User',
            'email' => 'noterms@example.com',
            'phone' => '0912345678',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors(['terms']);
        $this->assertGuest();
    }

    protected function setUp(): void
    {
        parent::setUp();

        // Avoid Spatie permission cache bleeding between tests.
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
