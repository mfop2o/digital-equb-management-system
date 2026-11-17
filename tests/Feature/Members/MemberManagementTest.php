<?php

namespace Tests\Feature\Members;

use App\Enums\KycStatus;
use App\Enums\MemberStatus;
use App\Models\MemberProfile;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $organizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->organizer = User::factory()->create();
        $this->organizer->assignRole('organizer');
    }

    public function test_authorized_user_can_view_members_index()
    {
        MemberProfile::create([
            'member_number' => 'EQB-M-00001',
            'first_name' => 'Abebe',
            'middle_name' => 'Bikila',
            'last_name' => 'Demissie',
            'phone' => '0911223344',
            'phone_normalized' => '+251911223344',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
        ]);

        $response = $this->actingAs($this->admin)->get(route('members.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('members/index')
            ->has('members.data', 1)
        );
    }

    public function test_authorized_user_can_register_a_member()
    {
        $response = $this->actingAs($this->admin)->post(route('members.store'), [
            'first_name' => 'Almaz',
            'middle_name' => 'Ayana',
            'last_name' => 'Eba',
            'phone' => '0912345678',
            'email' => 'almaz@example.com',
            'address_city' => 'Addis Ababa',
            'address_subcity' => 'Bole',
            'id_type' => 'national_id',
            'id_number' => 'ET-FAN-987654321',
        ]);

        $response->assertRedirect();

        $member = MemberProfile::where('email', 'almaz@example.com')->first();
        $this->assertNotNull($member);
        $this->assertSame('+251912345678', $member->phone_normalized);
        $this->assertStringStartsWith('EQB-M-', $member->member_number);
        $this->assertSame(MemberStatus::Active, $member->status);

        // Verification attached
        $this->assertDatabaseHas('member_identifications', [
            'member_profile_id' => $member->id,
            'id_type' => 'national_id',
            'id_number' => 'ET-FAN-987654321',
            'is_primary' => true,
        ]);

        // Audit log created
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'member.created',
            'auditable_type' => $member->getMorphClass(),
            'auditable_id' => $member->id,
        ]);
    }

    public function test_duplicate_phone_number_is_rejected()
    {
        MemberProfile::create([
            'member_number' => 'EQB-M-00001',
            'first_name' => 'Existing',
            'middle_name' => 'Member',
            'last_name' => 'Person',
            'phone' => '0911223344',
            'phone_normalized' => '+251911223344',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
        ]);

        $response = $this->actingAs($this->admin)->post(route('members.store'), [
            'first_name' => 'New',
            'middle_name' => 'Duplicate',
            'last_name' => 'Phone',
            'phone' => '+251911223344', // Duplicate phone in international format
            'address_city' => 'Addis Ababa',
        ]);

        $response->assertSessionHasErrors('phone');
    }

    public function test_authorized_user_can_verify_member_kyc()
    {
        $member = MemberProfile::create([
            'member_number' => 'EQB-M-00002',
            'first_name' => 'Kenenisa',
            'middle_name' => 'Bekele',
            'last_name' => 'Beyecha',
            'phone' => '0922334455',
            'phone_normalized' => '+251922334455',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Pending,
        ]);

        $response = $this->actingAs($this->admin)->post(route('members.verify', $member), [
            'decision' => 'verified',
            'notes' => 'Kebele ID verified against physical card.',
        ]);

        $response->assertRedirect();

        $member->refresh();
        $this->assertSame(KycStatus::Verified, $member->kyc_status);

        $this->assertDatabaseHas('member_verifications', [
            'member_profile_id' => $member->id,
            'verified_by_user_id' => $this->admin->id,
            'decision' => 'verified',
        ]);
    }

    public function test_kyc_rejection_requires_rejection_reason()
    {
        $member = MemberProfile::create([
            'member_number' => 'EQB-M-00003',
            'first_name' => 'Derartu',
            'middle_name' => 'Tulu',
            'last_name' => 'Bekele',
            'phone' => '0933445566',
            'phone_normalized' => '+251933445566',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Pending,
        ]);

        $response = $this->actingAs($this->admin)->post(route('members.verify', $member), [
            'decision' => 'rejected',
            // Missing rejection_reason
        ]);

        $response->assertSessionHasErrors('rejection_reason');
    }

    public function test_unauthorized_user_cannot_register_members()
    {
        $unauthorizedUser = User::factory()->create(); // No roles assigned

        $response = $this->actingAs($unauthorizedUser)->post(route('members.store'), [
            'first_name' => 'Test',
            'middle_name' => 'Unauthorized',
            'last_name' => 'User',
            'phone' => '0944556677',
        ]);

        $response->assertForbidden();
    }
}
