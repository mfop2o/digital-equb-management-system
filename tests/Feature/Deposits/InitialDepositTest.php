<?php

declare(strict_types=1);

namespace Tests\Feature\Deposits;

use App\Enums\ContributionFrequency;
use App\Enums\CycleStatus;
use App\Enums\DepositObligationStatus;
use App\Enums\GroupRole;
use App\Enums\GroupStatus;
use App\Enums\InitialDepositTreatment;
use App\Enums\KycStatus;
use App\Enums\MembershipStatus;
use App\Enums\MemberStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PayoutCommencementRule;
use App\Enums\RotationMethod;
use App\Enums\UserStatus;
use App\Models\DepositObligation;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\EqubGroupRule;
use App\Models\EqubMembership;
use App\Models\MemberProfile;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\User;
use App\Services\DepositRoundService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class InitialDepositTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $treasurerUser;

    protected User $regularUser;

    protected EqubGroup $group;

    protected EqubMembership $organizerMembership;

    protected EqubMembership $regularMembership;

    protected DepositRoundService $service;

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
            'name' => 'Addis Tesfa Equb',
            'group_code' => 'EQB-2026-001',
            'description' => 'Test Equb Group',
            'category' => 'Commercial',
            'status' => GroupStatus::Active,
            'max_members' => 10,
            'created_by_user_id' => $this->admin->id,
        ]);

        EqubGroupRule::create([
            'equb_group_id' => $this->group->id,
            'contribution_amount' => 5000.00,
            'contribution_frequency' => ContributionFrequency::Monthly,
            'expected_members' => 10,
            'initial_deposit_rounds' => 2,
            'initial_deposit_amount' => 500.00,
            'initial_deposit_treatment' => InitialDepositTreatment::Retained,
            'payout_commencement_rule' => PayoutCommencementRule::DepositCompletionOnly,
            'rotation_method' => RotationMethod::Predetermined,
            'allow_partial_contributions' => false,
            'late_penalty_enabled' => true,
            'late_penalty_fixed_amount' => 100.00,
            'late_penalty_daily_rate' => 0.00,
            'late_penalty_grace_days' => 2,
            'is_active' => true,
            'version' => 1,
            'configured_by_user_id' => $this->admin->id,
        ]);

        // Create Organizer profile + membership
        $organizerProfile = MemberProfile::create([
            'member_number' => 'EQB-M-00001',
            'first_name' => 'Abebe',
            'middle_name' => 'Kebede',
            'last_name' => 'Tesfaye',
            'phone' => '+251911000001',
            'phone_normalized' => '+251911000001',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
            'created_by_user_id' => $this->admin->id,
        ]);

        $this->organizerMembership = EqubMembership::create([
            'equb_group_id' => $this->group->id,
            'member_profile_id' => $organizerProfile->id,
            'membership_number' => 'ADD-001',
            'role' => GroupRole::Organizer,
            'status' => MembershipStatus::Active,
            'payout_order_number' => 1,
            'joined_at' => now(),
            'approved_by_user_id' => $this->admin->id,
        ]);

        // Create Regular member profile + membership
        $regularProfile = MemberProfile::create([
            'member_number' => 'EQB-M-00002',
            'first_name' => 'Sara',
            'middle_name' => 'Haile',
            'last_name' => 'Wolde',
            'phone' => '+251911000002',
            'phone_normalized' => '+251911000002',
            'status' => MemberStatus::Active,
            'kyc_status' => KycStatus::Verified,
            'created_by_user_id' => $this->admin->id,
        ]);

        $this->regularMembership = EqubMembership::create([
            'equb_group_id' => $this->group->id,
            'member_profile_id' => $regularProfile->id,
            'membership_number' => 'ADD-002',
            'role' => GroupRole::Member,
            'status' => MembershipStatus::Active,
            'payout_order_number' => 2,
            'joined_at' => now(),
            'approved_by_user_id' => $this->admin->id,
        ]);

        $this->service = app(DepositRoundService::class);
    }

    public function test_cycle_and_deposit_rounds_are_initialized_with_configured_count(): void
    {
        $cycle = $this->service->createCycleForGroup($this->group, $this->admin);

        $this->assertInstanceOf(EqubCycle::class, $cycle);
        $this->assertEquals(CycleStatus::DepositStage, $cycle->status);
        $this->assertCount(2, $this->group->depositRounds);
        $this->assertEquals(500.00, (float) $this->group->depositRounds->first()->amount_per_member);
    }

    public function test_all_active_members_including_organizers_have_deposit_obligations(): void
    {
        $cycle = $this->service->createCycleForGroup($this->group, $this->admin);
        $round = $this->group->depositRounds->first();

        $this->service->openRound($round, $this->admin);

        // Confirmed rule: organizers are active members and are not exempt.
        $organizerObligation = DepositObligation::where('deposit_round_id', $round->id)
            ->where('equb_membership_id', $this->organizerMembership->id)
            ->first();

        $this->assertNotNull($organizerObligation);
        $this->assertFalse($organizerObligation->is_exempt);
        $this->assertEquals(500.00, (float) $organizerObligation->amount_due);
        $this->assertEquals(DepositObligationStatus::Pending, $organizerObligation->status);

        // Check regular member obligation
        $regularObligation = DepositObligation::where('deposit_round_id', $round->id)
            ->where('equb_membership_id', $this->regularMembership->id)
            ->first();

        $this->assertNotNull($regularObligation);
        $this->assertFalse($regularObligation->is_exempt);
        $this->assertEquals(500.00, (float) $regularObligation->amount_due);
        $this->assertEquals(DepositObligationStatus::Pending, $regularObligation->status);
    }

    public function test_payment_submission_and_allocation(): void
    {
        $this->service->createCycleForGroup($this->group, $this->admin);
        $round = $this->group->depositRounds->first();
        $this->service->openRound($round, $this->admin);

        $regularObligation = DepositObligation::where('deposit_round_id', $round->id)
            ->where('equb_membership_id', $this->regularMembership->id)
            ->first();

        $payment = $this->service->recordDepositPayment($regularObligation, [
            'amount' => 500.00,
            'method' => PaymentMethod::MobileMoney,
            'reference' => 'TEL-123456789',
            'paid_on' => now()->toDateString(),
        ], $this->regularUser);

        $this->assertEquals(PaymentStatus::Submitted, $payment->status);
        $this->assertEquals(500.00, (float) $payment->amount);
        $this->assertCount(1, $payment->allocations);
        $this->assertEquals($regularObligation->id, $payment->allocations->first()->deposit_obligation_id);

        $regularObligation->refresh();
        $this->assertEquals(DepositObligationStatus::Submitted, $regularObligation->status);
    }

    public function test_maker_checker_prevents_submitter_from_verifying_own_payment(): void
    {
        $this->service->createCycleForGroup($this->group, $this->admin);
        $round = $this->group->depositRounds->first();
        $this->service->openRound($round, $this->admin);

        $regularObligation = DepositObligation::where('deposit_round_id', $round->id)
            ->where('equb_membership_id', $this->regularMembership->id)
            ->first();

        $payment = $this->service->recordDepositPayment($regularObligation, [
            'amount' => 500.00,
            'method' => PaymentMethod::BankTransfer,
            'reference' => 'CBE-987654321',
            'paid_on' => now()->toDateString(),
        ], $this->treasurerUser);

        $this->expectException(ValidationException::class);

        // Submitter attempting to verify their own transaction must fail
        $this->service->verifyDepositPayment($payment, $this->treasurerUser, 'verified');
    }

    public function test_treasurer_verification_updates_obligation_and_issues_receipt(): void
    {
        $this->service->createCycleForGroup($this->group, $this->admin);
        $round = $this->group->depositRounds->first();
        $this->service->openRound($round, $this->admin);

        $regularObligation = DepositObligation::where('deposit_round_id', $round->id)
            ->where('equb_membership_id', $this->regularMembership->id)
            ->first();

        $payment = $this->service->recordDepositPayment($regularObligation, [
            'amount' => 500.00,
            'method' => PaymentMethod::BankTransfer,
            'reference' => 'CBE-987654321',
            'paid_on' => now()->toDateString(),
        ], $this->regularUser);

        // Different user (treasurer) verifies the payment
        $verifiedPayment = $this->service->verifyDepositPayment($payment, $this->treasurerUser, 'verified');

        $this->assertEquals(PaymentStatus::Verified, $verifiedPayment->status);
        $this->assertEquals($this->treasurerUser->id, $verifiedPayment->verified_by);

        $regularObligation->refresh();
        $this->assertEquals(DepositObligationStatus::Verified, $regularObligation->status);
        $this->assertEquals(500.00, (float) $regularObligation->amount_paid);

        // Check official receipt creation
        $receipt = Receipt::where('receiptable_id', $payment->id)
            ->where('receiptable_type', Payment::class)
            ->first();

        $this->assertNotNull($receipt);
        $this->assertStringStartsWith('REC-', $receipt->receipt_number);
        $this->assertEquals(500.00, (float) $receipt->amount);
    }

    public function test_cannot_close_round_with_pending_unverified_obligations(): void
    {
        $this->service->createCycleForGroup($this->group, $this->admin);
        $round = $this->group->depositRounds->first();
        $this->service->openRound($round, $this->admin);

        $this->expectException(ValidationException::class);

        // Cannot close when regular member has not verified deposit
        $this->service->closeRound($round, $this->admin);
    }

    public function test_accumulated_deposits_are_reported_as_retained(): void
    {
        $this->service->createCycleForGroup($this->group, $this->admin);
        $round = $this->group->depositRounds->first();
        $this->service->openRound($round, $this->admin);

        $regularObligation = DepositObligation::where('deposit_round_id', $round->id)
            ->where('equb_membership_id', $this->regularMembership->id)
            ->first();

        $payment = $this->service->recordDepositPayment($regularObligation, [
            'amount' => 500.00,
            'method' => PaymentMethod::Cash,
            'paid_on' => now()->toDateString(),
        ], $this->regularUser);

        $this->service->verifyDepositPayment($payment, $this->treasurerUser, 'verified');

        $accumulated = $this->service->calculateAccumulatedDeposits($this->group);

        $this->assertEquals('500.00', $accumulated['total_verified']);
        // Confirmed: verified deposits are retained; no distribution policy is assumed.
        $this->assertEquals('500.00', $accumulated['retained_deposits']);
        $this->assertArrayNotHasKey('organizer_compensation_pool', $accumulated);
    }
}
