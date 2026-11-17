<?php

namespace Tests\Feature\Auth;

use App\Enums\UserStatus;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_deactivated_users_cannot_authenticate()
    {
        $user = User::factory()->create();
        $user->deactivate('Left the organization');

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');
    }

    public function test_suspended_users_cannot_authenticate()
    {
        $user = User::factory()->create();
        $user->forceFill(['status' => UserStatus::Suspended])->save();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');
    }

    public function test_an_open_session_is_invalidated_when_the_account_is_deactivated()
    {
        $user = User::factory()->create();

        $this->actingAs($user);
        $user->deactivate('Access revoked');

        $response = $this->get(route('dashboard'));

        $this->assertGuest();
        $response->assertRedirect(route('login'));
        $response->assertSessionHasErrors('email');
    }

    public function test_deactivation_keeps_the_user_and_financial_references()
    {
        $user = User::factory()->create();

        $user->deactivate('Suspended pending review');

        $fresh = $user->fresh();

        $this->assertNotNull($fresh);
        $this->assertSame(UserStatus::Inactive, $fresh->status);
        $this->assertNotNull($fresh->deactivated_at);
        $this->assertSame('Suspended pending review', $fresh->deactivation_reason);
    }

    public function test_reactivation_restores_access()
    {
        $user = User::factory()->create();
        $user->deactivate();

        $user->activate();

        $this->assertSame(UserStatus::Active, $user->refresh()->status);
        $this->assertNull($user->deactivated_at);

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_deactivated_users_keep_their_roles()
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('treasurer');

        $user->deactivate();

        $this->assertTrue($user->refresh()->hasRole('treasurer'));
    }
}
