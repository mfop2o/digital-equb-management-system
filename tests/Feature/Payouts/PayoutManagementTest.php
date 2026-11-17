<?php

declare(strict_types=1);

namespace Tests\Feature\Payouts;

use App\Enums\ContributionFrequency;
use App\Enums\CycleStatus;
use App\Enums\DepositRoundStatus;
use App\Enums\GroupRole;
use App\Enums\GroupStatus;
use App\Enums\InitialDepositTreatment;
use App\Enums\KycStatus;
use App\Enums\MembershipStatus;
use App\Enums\MemberStatus;
use App\Enums\PayoutCommencementRule;
use App\Enums\PayoutStatus;
use App\Enums\ReceiptType;
use App\Enums\RotationMethod;
use App\Enums\UserStatus;
use App\Models\DepositRound;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\EqubGroupRule;
use App\Models\EqubMembership;
use App\Models\MemberProfile;
use App\Models\Payout;
use App\Models\Receipt;
use App\Models\User;
use App\Services\PayoutService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PayoutManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $organizerUser;

    protected User $treasurerUser;

    protected EqubGroup $group;

    protected EqubCycle $cycle;

    protected EqubMembership $membership1;

    protected EqubMembership $membership2;

    protected PayoutService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create([
            'status' => UserStatus::Active,
            'must_change_password' => false,
        ]);
        $this->admin->assignRole('super-admin');

        $this->organizerUser = User::factory()->create([
            'status' => UserStatus::Active,
            'must_change_password' => false,
        ]);
        $this->organizerUser->assignRole('organizer');

        $this->treasurerUser = User::factory()->create([
            'status' => UserStatus::Active,
            'must_change_password' => false,
        ]);
        $this->treasurerUser->assignRole('treasurer');

        $this->group = EqubGroup::create([
            'name' => 'Abyssinia Gold Equb',
            'group_code' => 'EQB-2026-ABY',
            'description' => 'Abyssinia Merchant Equb',
            'category' => 'Premium',
            'status' => GroupStatus::Active,
            'max_members' => 5,
            'created_by_user_id' => $this->admin->id,
        ]);

        EqubGroupRule::create([
            'equb_group_id' => $this->group->id,
            'contribution_amount' => 10000.00,
            'contribution_frequency' => ContributionFrequency::Monthly,
            'expected_members' => 2,
            'initial_deposit_rounds' => 1,
            'initial_deposit_amount' => 1000.00,
            'initial_deposit_treatment' => InitialDepositTreatment::Retained,
            'payout_commencement_rule' => PayoutCommencementRule::DepositCompletionOnly,
            'rotation_method' => RotationMethod::Predetermined,
            'allow_partial_contributions' => false,
            'late_penalty_enabled' => true,
            'late_penalty_fixed_amount' => 200.00,
            'late_penalty_daily_rate' => 0.00,
            'late_penalty_grace_days' => 2,
            'is_active' => true,
            'version' => 1,
            'configured_by_user_id' => $this->admin->id,
        ]);

        $this->cycle = EqubCycle::create([
            'equb_group_id' => $this->group->id,
            'cycle_number' => 1,
            'status' => CycleStatus::Ready,
            'started_on' => now()->toDateString(),
            'created_by' => $this->admin->id,
        ]);

        $profile1 = MemberProfile::create([
            'member_number' => 'EQB-M-00501',
            'first_name' => 'Yared',
            'middle_name' => 'Solomon',
            'last_name' => 'Bekele',
            'phone' => '+251911500501',
            'phone_normalized' => '+251911500501',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
            'created_by_user_id' => $this->admin->id,
        ]);

        $this->membership1 = EqubMembership::create([
            'equb_group_id' => $this->group->id,
            'member_profile_id' => $profile1->id,
            'membership_number' => 'ABY-001',
            'role' => GroupRole::Member,
            'status' => MembershipStatus::Active,
            'payout_order_number' => 1,
            'joined_at' => now(),
            'approved_by_user_id' => $this->admin->id,
        ]);

        $profile2 = MemberProfile::create([
            'member_number' => 'EQB-M-00502',
            'first_name' => 'Bethlehem',
            'middle_name' => 'Fikre',
            'last_name' => 'Wondimu',
            'phone' => '+251911500502',
            'phone_normalized' => '+251911500502',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
            'created_by_user_id' => $this->admin->id,
        ]);

        $this->membership2 = EqubMembership::create([
            'equb_group_id' => $this->group->id,
            'member_profile_id' => $profile2->id,
            'membership_number' => 'ABY-002',
            'role' => GroupRole::Member,
            'status' => MembershipStatus::Active,
            'payout_order_number' => 2,
            'joined_at' => now(),
            'approved_by_user_id' => $this->admin->id,
        ]);

        $this->service = app(PayoutService::class);
    }

    public function test_payout_commencement_blocked_when_deposit_stage_incomplete_d02(): void
    {
        // Add an open/unclosed deposit round
        DepositRound::create([
            'equb_group_id' => $this->group->id,
            'equb_cycle_id' => $this->cycle->id,
            'sequence' => 1,
            'label' => 'Initial Deposit Round 1',
            'amount_per_member' => 1000.00,
            'opens_on' => now()->toDateString(),
            'due_on' => now()->addDays(5)->toDateString(),
            'closes_on' => now()->addDays(7)->toDateString(),
            'status' => DepositRoundStatus::Open,
        ]);

        $check = $this->service->canCommencePayouts($this->group);

        $this->assertFalse($check['can_commence']);
        $this->assertNotEmpty($check['reasons']);
    }

    public function test_payout_rotation_created_in_predetermined_order_with_full_pot_d06(): void
    {
        // Close deposit round so commencement passes
        DepositRound::create([
            'equb_group_id' => $this->group->id,
            'equb_cycle_id' => $this->cycle->id,
            'sequence' => 1,
            'label' => 'Initial Deposit Round 1',
            'amount_per_member' => 1000.00,
            'opens_on' => now()->toDateString(),
            'due_on' => now()->addDays(5)->toDateString(),
            'closes_on' => now()->addDays(7)->toDateString(),
            'status' => DepositRoundStatus::Closed,
        ]);

        $payouts = $this->service->schedulePayoutRotation($this->group, $this->cycle, $this->admin);

        $this->assertCount(2, $payouts);

        // Sequence 1 should be membership 1 (order 1)
        $slot1 = $payouts->firstWhere('payout_sequence', 1);
        $this->assertEquals($this->membership1->id, $slot1->equb_membership_id);
        // Pot amount: 2 members * 10,000 ETB = 20,000 ETB
        $this->assertEquals(20000.00, (float) $slot1->amount);
        $this->assertEquals(PayoutStatus::Scheduled, $slot1->status);

        // Sequence 2 should be membership 2 (order 2)
        $slot2 = $payouts->firstWhere('payout_sequence', 2);
        $this->assertEquals($this->membership2->id, $slot2->equb_membership_id);
    }

    public function test_maker_checker_on_payout_approval(): void
    {
        DepositRound::create([
            'equb_group_id' => $this->group->id,
            'equb_cycle_id' => $this->cycle->id,
            'sequence' => 1,
            'label' => 'Initial Deposit Round 1',
            'amount_per_member' => 1000.00,
            'opens_on' => now()->toDateString(),
            'due_on' => now()->addDays(5)->toDateString(),
            'closes_on' => now()->addDays(7)->toDateString(),
            'status' => DepositRoundStatus::Closed,
        ]);

        $payouts = $this->service->schedulePayoutRotation($this->group, $this->cycle, $this->admin);
        $slot1 = $payouts->first();

        // Requester requests approval
        $this->service->requestPayoutApproval($slot1, $this->organizerUser);

        $this->expectException(ValidationException::class);

        // Requester attempting to approve own request must fail
        $this->service->approvePayout($slot1, $this->organizerUser);
    }

    public function test_disbursement_issues_receipt_and_marks_membership_as_having_received_payout(): void
    {
        DepositRound::create([
            'equb_group_id' => $this->group->id,
            'equb_cycle_id' => $this->cycle->id,
            'sequence' => 1,
            'label' => 'Initial Deposit Round 1',
            'amount_per_member' => 1000.00,
            'opens_on' => now()->toDateString(),
            'due_on' => now()->addDays(5)->toDateString(),
            'closes_on' => now()->addDays(7)->toDateString(),
            'status' => DepositRoundStatus::Closed,
        ]);

        $payouts = $this->service->schedulePayoutRotation($this->group, $this->cycle, $this->admin);
        $slot1 = $payouts->first();

        $this->service->requestPayoutApproval($slot1, $this->organizerUser);
        $this->service->approvePayout($slot1, $this->admin);

        // Disbursed by treasurer (different user from admin who approved)
        $disbursedPayout = $this->service->disburse($slot1, [
            'method' => 'bank_transfer',
            'account_reference' => 'CBE-100012345678',
            'disbursed_on' => now()->toDateString(),
            'disbursement_reference' => 'DISB-ABY-001',
            'notes' => 'Disbursed to Abebe via CBE transfer',
        ], $this->treasurerUser);

        $this->assertEquals(PayoutStatus::Disbursed, $disbursedPayout->status);
        $this->assertEquals('DISB-ABY-001', $disbursedPayout->disbursement_reference);

        // Check receipt
        $receipt = Receipt::where('receiptable_id', $slot1->id)
            ->where('receiptable_type', Payout::class)
            ->first();

        $this->assertNotNull($receipt);
        $this->assertEquals(ReceiptType::Payout, $receipt->receipt_type);
        $this->assertEquals(20000.00, (float) $receipt->amount);

        // Critical: Check membership hasReceivedPayout()
        $this->assertTrue($this->membership1->hasReceivedPayout());

        // Completion is a separate final transition after disbursement
        $completed = $this->service->complete($slot1->fresh(), $this->admin);
        $this->assertEquals(PayoutStatus::Completed, $completed->status);
        $this->assertNotNull($completed->completed_at);
    }
}
