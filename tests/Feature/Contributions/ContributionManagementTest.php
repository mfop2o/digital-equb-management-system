<?php

declare(strict_types=1);

namespace Tests\Feature\Contributions;

use App\Enums\ContributionFrequency;
use App\Enums\CycleStatus;
use App\Enums\GroupRole;
use App\Enums\GroupStatus;
use App\Enums\InitialDepositTreatment;
use App\Enums\KycStatus;
use App\Enums\MembershipStatus;
use App\Enums\MemberStatus;
use App\Enums\PaymentMethod;
use App\Enums\PayoutCommencementRule;
use App\Enums\RotationMethod;
use App\Enums\UserStatus;
use App\Models\ContributionObligation;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\EqubGroupRule;
use App\Models\EqubMembership;
use App\Models\MemberProfile;
use App\Models\User;
use App\Services\ContributionService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ContributionManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $treasurerUser;

    protected User $regularUser;

    protected EqubGroup $group;

    protected EqubCycle $cycle;

    protected EqubMembership $membership1;

    protected EqubMembership $membership2;

    protected ContributionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create([
            'status' => UserStatus::Active,
            'must_change_password' => false,
        ]);
        $this->admin->assignRole('super-admin');

        $this->treasurerUser = User::factory()->create([
            'status' => UserStatus::Active,
            'must_change_password' => false,
        ]);
        $this->treasurerUser->assignRole('treasurer');

        $this->regularUser = User::factory()->create([
            'status' => UserStatus::Active,
            'must_change_password' => false,
        ]);
        $this->regularUser->assignRole('member');

        $this->group = EqubGroup::create([
            'name' => 'Walia Traders Equb',
            'group_code' => 'EQB-2026-WALIA',
            'description' => 'Commercial equb for traders',
            'category' => 'Business',
            'status' => GroupStatus::Active,
            'max_members' => 5,
            'created_by_user_id' => $this->admin->id,
        ]);

        EqubGroupRule::create([
            'equb_group_id' => $this->group->id,
            'contribution_amount' => 2000.00,
            'contribution_frequency' => ContributionFrequency::Weekly,
            'expected_members' => 5,
            'initial_deposit_rounds' => 0,
            'initial_deposit_amount' => 0.00,
            'initial_deposit_treatment' => InitialDepositTreatment::Retained,
            'payout_commencement_rule' => PayoutCommencementRule::ManualAdminApproval,
            'rotation_method' => RotationMethod::Predetermined,
            'allow_partial_contributions' => false,
            'late_penalty_enabled' => true,
            'late_penalty_fixed_amount' => 50.00,
            'late_penalty_daily_rate' => 0.00,
            'late_penalty_grace_days' => 2,
            'is_active' => true,
            'version' => 1,
            'configured_by_user_id' => $this->admin->id,
        ]);

        $this->cycle = EqubCycle::create([
            'equb_group_id' => $this->group->id,
            'cycle_number' => 1,
            'status' => CycleStatus::Active,
            'started_on' => now()->toDateString(),
            'activated_on' => now()->toDateString(),
            'created_by' => $this->admin->id,
        ]);

        $profile1 = MemberProfile::create([
            'member_number' => 'EQB-M-00101',
            'first_name' => 'Dawit',
            'middle_name' => 'Girma',
            'last_name' => 'Tadesse',
            'phone' => '+251911100101',
            'phone_normalized' => '+251911100101',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
            'created_by_user_id' => $this->admin->id,
        ]);

        $this->membership1 = EqubMembership::create([
            'equb_group_id' => $this->group->id,
            'member_profile_id' => $profile1->id,
            'membership_number' => 'WAL-001',
            'role' => GroupRole::Member,
            'status' => MembershipStatus::Active,
            'payout_order_number' => 1,
            'joined_at' => now(),
            'approved_by_user_id' => $this->admin->id,
        ]);

        $profile2 = MemberProfile::create([
            'member_number' => 'EQB-M-00102',
            'first_name' => 'Meron',
            'middle_name' => 'Kassahun',
            'last_name' => 'Alemu',
            'phone' => '+251911100102',
            'phone_normalized' => '+251911100102',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
            'created_by_user_id' => $this->admin->id,
        ]);

        $this->membership2 = EqubMembership::create([
            'equb_group_id' => $this->group->id,
            'member_profile_id' => $profile2->id,
            'membership_number' => 'WAL-002',
            'role' => GroupRole::Member,
            'status' => MembershipStatus::Active,
            'payout_order_number' => 2,
            'joined_at' => now(),
            'approved_by_user_id' => $this->admin->id,
        ]);

        $this->service = app(ContributionService::class);
    }

    public function test_generates_correct_number_of_periods_for_group(): void
    {
        $periods = $this->service->generateContributionPeriods($this->group, $this->cycle, $this->admin);

        $this->assertCount(5, $periods);
        $this->assertEquals(2000.00, (float) $periods->first()->amount_due_snapshot);
        $this->assertEquals('open', $periods->first()->status);
    }

    public function test_generates_obligations_for_all_active_members(): void
    {
        $periods = $this->service->generateContributionPeriods($this->group, $this->cycle, $this->admin);
        $firstPeriod = $periods->first();

        $obligations = $this->service->generateMemberObligations($firstPeriod, $this->admin);

        $this->assertCount(2, $obligations);
        $this->assertEquals(2000.00, (float) $obligations->first()->amount_due);
        $this->assertEquals('pending', $obligations->first()->status);
    }

    public function test_red_status_when_member_has_unpaid_obligation(): void
    {
        $periods = $this->service->generateContributionPeriods($this->group, $this->cycle, $this->admin);
        $this->service->generateMemberObligations($periods->first(), $this->admin);

        $classification = $this->service->classifyMemberStatus($this->membership1);

        $this->assertEquals('red', $classification['color']);
    }

    public function test_green_status_when_obligation_is_verified(): void
    {
        $periods = $this->service->generateContributionPeriods($this->group, $this->cycle, $this->admin);
        $this->service->generateMemberObligations($periods->first(), $this->admin);

        $obligation = ContributionObligation::where('equb_membership_id', $this->membership1->id)->first();

        $payment = $this->service->recordContributionPayment($obligation, [
            'amount' => 2000.00,
            'method' => PaymentMethod::MobileMoney,
            'reference' => 'CBE-BIRR-12345',
            'paid_on' => now()->toDateString(),
        ], $this->regularUser);

        $this->service->verifyContributionPayment($payment, $this->treasurerUser, 'verified');

        $classification = $this->service->classifyMemberStatus($this->membership1);

        $this->assertEquals('green', $classification['color']);
    }

    public function test_maker_checker_prevents_submitter_from_verifying_own_contribution(): void
    {
        $periods = $this->service->generateContributionPeriods($this->group, $this->cycle, $this->admin);
        $this->service->generateMemberObligations($periods->first(), $this->admin);

        $obligation = ContributionObligation::where('equb_membership_id', $this->membership1->id)->first();

        $payment = $this->service->recordContributionPayment($obligation, [
            'amount' => 2000.00,
            'method' => PaymentMethod::BankTransfer,
            'reference' => 'AWASH-999',
            'paid_on' => now()->toDateString(),
        ], $this->treasurerUser);

        $this->expectException(ValidationException::class);

        $this->service->verifyContributionPayment($payment, $this->treasurerUser, 'verified');
    }
}
