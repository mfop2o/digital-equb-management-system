<?php

namespace Tests\Feature\Groups;

use App\Enums\GroupRole;
use App\Enums\GroupStatus;
use App\Enums\InitialDepositTreatment;
use App\Enums\KycStatus;
use App\Enums\MemberStatus;
use App\Models\EqubGroup;
use App\Models\MemberProfile;
use App\Models\User;
use App\Services\DepositRoundService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EqubGroupManagementTest extends TestCase
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

    public function test_authorized_user_can_create_equb_group_with_rules()
    {
        $response = $this->actingAs($this->admin)->post(route('groups.store'), [
            'name' => 'Bole Merchants Equb',
            'category' => 'Business',
            'max_members' => 12,
            'contribution_amount' => 5000.00,
            'contribution_frequency' => 'monthly',
            'expected_members' => 12,

            // Confirmed: initial deposits are accumulated and retained
            'initial_deposit_rounds' => 3,
            'initial_deposit_amount' => 1000.00,
            'initial_deposit_treatment' => 'retained',

            'rotation_method' => 'predetermined',
            'payout_commencement_rule' => 'deposit_completion_and_date',
            'payout_commencement_date' => now()->addMonths(3)->format('Y-m-d'),
        ]);

        $response->assertRedirect();

        $group = EqubGroup::where('name', 'Bole Merchants Equb')->first();
        $this->assertNotNull($group);
        $this->assertSame(GroupStatus::Draft, $group->status);
        $this->assertStringStartsWith('EQB-', $group->group_code);

        // Active rule created
        $rule = $group->activeRule;
        $this->assertNotNull($rule);
        $this->assertEquals(5000.00, $rule->contribution_amount);
        $this->assertSame(3, $rule->initial_deposit_rounds);
        $this->assertEquals(1000.00, $rule->initial_deposit_amount);
        $this->assertSame(InitialDepositTreatment::Retained, $rule->initial_deposit_treatment);

        // Creator added to staff
        $this->assertTrue($group->staffUsers()->where('user_id', $this->admin->id)->exists());
    }

    public function test_every_active_member_including_organizer_is_subject_to_deposit_obligations()
    {
        // 1. Create group with initial deposit rounds
        $group = EqubGroup::create([
            'name' => 'Test Equb Group',
            'group_code' => 'EQB-2026-001',
            'status' => GroupStatus::Draft,
            'max_members' => 10,
            'created_by_user_id' => $this->admin->id,
        ]);

        $group->rules()->create([
            'contribution_amount' => 2000.00,
            'contribution_frequency' => 'monthly',
            'expected_members' => 10,
            'initial_deposit_rounds' => 2,
            'initial_deposit_amount' => 500.00,
            'initial_deposit_treatment' => InitialDepositTreatment::Retained,
            'is_active' => true,
            'version' => 1,
            'configured_by_user_id' => $this->admin->id,
        ]);

        // 2. Create two member profiles
        $organizerProfile = MemberProfile::create([
            'member_number' => 'EQB-M-00001',
            'first_name' => 'Organizer',
            'middle_name' => 'Danya',
            'last_name' => 'Leader',
            'phone' => '0911000001',
            'phone_normalized' => '+251911000001',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
        ]);

        $memberProfile = MemberProfile::create([
            'member_number' => 'EQB-M-00002',
            'first_name' => 'Regular',
            'middle_name' => 'Equb',
            'last_name' => 'Member',
            'phone' => '0911000002',
            'phone_normalized' => '+251911000002',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
        ]);

        // 3. Enroll organizer
        $this->actingAs($this->admin)->post(route('groups.enroll', $group), [
            'member_profile_id' => $organizerProfile->id,
            'role' => GroupRole::Organizer->value,
        ]);

        // 4. Enroll regular member
        $this->actingAs($this->admin)->post(route('groups.enroll', $group), [
            'member_profile_id' => $memberProfile->id,
            'role' => GroupRole::Member->value,
            'payout_order_number' => 1,
        ]);

        $organizerMembership = $group->memberships()->where('member_profile_id', $organizerProfile->id)->first();
        $regularMembership = $group->memberships()->where('member_profile_id', $memberProfile->id)->first();

        $this->assertNotNull($organizerMembership);
        $this->assertNotNull($regularMembership);

        // 5. Open the first deposit round.
        $service = app(DepositRoundService::class);
        $service->createCycleForGroup($group, $this->admin);
        $round = $group->depositRounds()->firstOrFail();
        $service->openRound($round, $this->admin);

        // Confirmed rule: all active members, including organizers, must satisfy the same obligation.
        $organizerObligation = $round->obligations()->where('equb_membership_id', $organizerMembership->id)->first();
        $regularObligation = $round->obligations()->where('equb_membership_id', $regularMembership->id)->first();

        $this->assertNotNull($organizerObligation);
        $this->assertNotNull($regularObligation);
        $this->assertFalse($organizerObligation->is_exempt);
        $this->assertFalse($regularObligation->is_exempt);
        $this->assertEquals(500.00, (float) $organizerObligation->amount_due);
        $this->assertEquals(500.00, (float) $regularObligation->amount_due);
    }

    public function test_cannot_enroll_same_member_twice_in_one_group()
    {
        $group = EqubGroup::create([
            'name' => 'Single Enrollment Group',
            'group_code' => 'EQB-2026-002',
            'status' => GroupStatus::Draft,
            'max_members' => 5,
            'created_by_user_id' => $this->admin->id,
        ]);

        $profile = MemberProfile::create([
            'member_number' => 'EQB-M-00010',
            'first_name' => 'Single',
            'middle_name' => 'Enroll',
            'last_name' => 'Test',
            'phone' => '0911998877',
            'phone_normalized' => '+251911998877',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
        ]);

        // First enrollment succeeds
        $this->actingAs($this->admin)->post(route('groups.enroll', $group), [
            'member_profile_id' => $profile->id,
            'role' => GroupRole::Member->value,
        ]);

        // Second enrollment in SAME group fails
        $response = $this->actingAs($this->admin)->post(route('groups.enroll', $group), [
            'member_profile_id' => $profile->id,
            'role' => GroupRole::Member->value,
        ]);

        $response->assertSessionHasErrors('member_profile_id');
        $this->assertEquals(1, $group->memberships()->where('member_profile_id', $profile->id)->count());
    }

    public function test_member_can_enroll_in_multiple_distinct_groups()
    {
        $group1 = EqubGroup::create([
            'name' => 'Group One',
            'group_code' => 'EQB-2026-003',
            'status' => GroupStatus::Draft,
            'max_members' => 5,
            'created_by_user_id' => $this->admin->id,
        ]);

        $group2 = EqubGroup::create([
            'name' => 'Group Two',
            'group_code' => 'EQB-2026-004',
            'status' => GroupStatus::Draft,
            'max_members' => 5,
            'created_by_user_id' => $this->admin->id,
        ]);

        $profile = MemberProfile::create([
            'member_number' => 'EQB-M-00020',
            'first_name' => 'Multi',
            'middle_name' => 'Group',
            'last_name' => 'Member',
            'phone' => '0911554433',
            'phone_normalized' => '+251911554433',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
        ]);

        // Enroll in Group 1
        $this->actingAs($this->admin)->post(route('groups.enroll', $group1), [
            'member_profile_id' => $profile->id,
            'role' => GroupRole::Member->value,
        ]);

        // Enroll in Group 2 (Confirmed Business Decision D-04: Multi-group membership supported)
        $this->actingAs($this->admin)->post(route('groups.enroll', $group2), [
            'member_profile_id' => $profile->id,
            'role' => GroupRole::Member->value,
        ]);

        $this->assertEquals(2, $profile->memberships()->count());
    }

    public function test_cannot_exceed_group_maximum_capacity()
    {
        $group = EqubGroup::create([
            'name' => 'Capacity Test Group',
            'group_code' => 'EQB-2026-005',
            'status' => GroupStatus::Draft,
            'max_members' => 1, // Only 1 member allowed
            'created_by_user_id' => $this->admin->id,
        ]);

        $profile1 = MemberProfile::create([
            'member_number' => 'EQB-M-00031',
            'first_name' => 'First',
            'middle_name' => 'Member',
            'last_name' => 'One',
            'phone' => '0911111111',
            'phone_normalized' => '+251911111111',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
        ]);

        $profile2 = MemberProfile::create([
            'member_number' => 'EQB-M-00032',
            'first_name' => 'Second',
            'middle_name' => 'Member',
            'last_name' => 'Two',
            'phone' => '0922222222',
            'phone_normalized' => '+251922222222',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
        ]);

        // Enroll first
        $this->actingAs($this->admin)->post(route('groups.enroll', $group), [
            'member_profile_id' => $profile1->id,
            'role' => GroupRole::Member->value,
        ]);

        // Enroll second (exceeds capacity)
        $response = $this->actingAs($this->admin)->post(route('groups.enroll', $group), [
            'member_profile_id' => $profile2->id,
            'role' => GroupRole::Member->value,
        ]);

        $response->assertSessionHasErrors('member_profile_id');
        $this->assertEquals(1, $group->memberships()->count());
    }
}
