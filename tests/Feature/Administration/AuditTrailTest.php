<?php

namespace Tests\Feature\Administration;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditTrailTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_creation_is_audited()
    {
        $user = User::factory()->create([
            'name' => 'Audited User',
            'email' => 'audited@example.com',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'event' => 'user.created',
            'auditable_type' => $user->getMorphClass(),
            'auditable_id' => $user->id,
        ]);
    }

    public function test_password_changes_are_marked_without_recording_the_hash()
    {
        $user = User::factory()->create();

        $user->forceFill(['password' => 'a-brand-new-secret'])->save();

        $log = DB::table('audit_logs')
            ->where('event', 'user.password_changed')
            ->where('auditable_id', $user->id)
            ->first();

        $this->assertNotNull($log);

        $payload = ($log->before ?? '').($log->after ?? '').($log->changed_fields ?? '');

        $this->assertStringNotContainsString('a-brand-new-secret', $payload);
        $this->assertStringNotContainsString('$2y$', $payload);
    }

    public function test_role_assignment_is_audited()
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('organizer');

        $log = DB::table('audit_logs')
            ->where('event', 'role.attached')
            ->where('auditable_id', $user->id)
            ->first();

        $this->assertNotNull($log);
        $this->assertStringContainsString('organizer', $log->after);
    }

    public function test_deactivation_is_audited()
    {
        $user = User::factory()->create();

        $user->deactivate('Policy violation');

        $log = DB::table('audit_logs')
            ->where('event', 'user.updated')
            ->where('auditable_id', $user->id)
            ->where('after', 'like', '%inactive%')
            ->first();

        $this->assertNotNull($log);
    }
}
