<?php

declare(strict_types=1);

namespace Tests\Feature\Finance;

use App\Enums\CycleStatus;
use App\Enums\GroupStatus;
use App\Enums\MembershipStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\EqubGroupRule;
use App\Models\EqubMembership;
use App\Models\JournalEntry;
use App\Models\MemberProfile;
use App\Models\Payment;
use App\Models\User;
use App\Services\FinancialLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class FinancialLedgerTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $name = 'Ledger User'): User
    {
        return User::factory()->create(['name' => $name]);
    }

    private function makeGroup(User $actor): EqubGroup
    {
        $group = EqubGroup::create([
            'name' => 'Ledger Test Equb',
            'group_code' => 'GRP-'.Str::upper(Str::random(8)),
            'status' => GroupStatus::Active,
            'created_by_user_id' => $actor->id,
        ]);

        EqubGroupRule::create([
            'equb_group_id' => $group->id,
            'contribution_frequency' => 'monthly',
            'contribution_amount' => '1000.00',
            'expected_members' => 10,
            'initial_deposit_rounds' => 1,
            'initial_deposit_amount' => '500.00',
            'initial_deposit_treatment' => 'retained',
            'payout_commencement_rule' => 'deposit_completion_and_date',
            'rotation_method' => 'predetermined',
            'allow_partial_contributions' => false,
            'is_active' => true,
            'configured_by_user_id' => $actor->id,
        ]);

        return $group;
    }

    private function makeMembership(EqubGroup $group, User $actor): EqubMembership
    {
        $profile = MemberProfile::create([
            'user_id' => $actor->id,
            'member_number' => 'MEM-'.Str::upper(Str::random(8)),
            'first_name' => 'Ledger',
            'middle_name' => 'Test',
            'last_name' => 'Member',
            'phone' => '09'.random_int(10000000, 99999999),
            'phone_normalized' => '+2519'.random_int(10000000, 99999999),
            'created_by_user_id' => $actor->id,
        ]);

        return EqubMembership::create([
            'equb_group_id' => $group->id,
            'member_profile_id' => $profile->id,
            'membership_number' => 'MBR-'.Str::upper(Str::random(8)),
            'role' => 'member',
            'status' => MembershipStatus::Active,
            'joined_at' => now(),
        ]);
    }

    private function makeCycle(EqubGroup $group, User $actor): EqubCycle
    {
        return EqubCycle::create([
            'equb_group_id' => $group->id,
            'cycle_number' => 1,
            'status' => CycleStatus::Active,
            'started_on' => now()->toDateString(),
            'created_by' => $actor->id,
        ]);
    }

    private function makePayment(EqubGroup $group, EqubCycle $cycle, EqubMembership $membership, User $actor, string $amount = '500.00'): Payment
    {
        return Payment::create([
            'equb_group_id' => $group->id,
            'equb_cycle_id' => $cycle->id,
            'equb_membership_id' => $membership->id,
            'member_profile_id' => $membership->member_profile_id,
            'submitted_by_user_id' => $actor->id,
            'payment_type' => PaymentType::Deposit,
            'amount' => $amount,
            'currency' => 'ETB',
            'method' => PaymentMethod::BankTransfer,
            'reference' => 'REF-'.Str::random(6),
            'paid_on' => now()->toDateString(),
            'status' => PaymentStatus::Verified,
            'idempotency_key' => 'test-'.Str::uuid(),
        ]);
    }

    public function test_setup_chart_of_accounts_creates_7_accounts(): void
    {
        $actor = $this->makeUser();
        $group = $this->makeGroup($actor);
        $ledger = app(FinancialLedgerService::class);

        $ledger->setupChartOfAccounts($group, $actor);

        $this->assertDatabaseCount('financial_accounts', 7);
        $this->assertDatabaseHas('financial_accounts', ['equb_group_id' => $group->id, 'code' => '1010']);
        $this->assertDatabaseHas('financial_accounts', ['equb_group_id' => $group->id, 'code' => '2020']);
    }

    public function test_setup_chart_of_accounts_is_idempotent(): void
    {
        $actor = $this->makeUser();
        $group = $this->makeGroup($actor);
        $ledger = app(FinancialLedgerService::class);

        $ledger->setupChartOfAccounts($group, $actor);
        $ledger->setupChartOfAccounts($group, $actor); // second call

        // Still only 7 accounts — no duplicates
        $this->assertDatabaseCount('financial_accounts', 7);
    }

    public function test_deposit_payment_posts_balanced_journal_entry(): void
    {
        $actor = $this->makeUser('Submitter');
        $group = $this->makeGroup($actor);
        $membership = $this->makeMembership($group, $actor);
        $ledger = app(FinancialLedgerService::class);
        $ledger->setupChartOfAccounts($group, $actor);

        $cycle = $this->makeCycle($group, $actor);
        $payment = $this->makePayment($group, $cycle, $membership, $actor, '500.00');

        $entry = $ledger->postInitialDeposit($payment, $actor);

        $this->assertNotNull($entry);
        $this->assertTrue($entry->isBalanced());
        $this->assertCount(2, $entry->lines);

        // Debits must equal credits
        $totalDebit = $entry->lines->sum('debit');
        $totalCredit = $entry->lines->sum('credit');
        $this->assertEquals($totalDebit, $totalCredit);
    }

    public function test_trial_balance_has_equal_debits_and_credits_after_deposit(): void
    {
        $actor = $this->makeUser();
        $group = $this->makeGroup($actor);
        $membership = $this->makeMembership($group, $actor);
        $ledger = app(FinancialLedgerService::class);
        $ledger->setupChartOfAccounts($group, $actor);

        $cycle = $this->makeCycle($group, $actor);
        $payment = $this->makePayment($group, $cycle, $membership, $actor, '1000.00');
        $ledger->postInitialDeposit($payment, $actor);

        $trialBalance = $ledger->getTrialBalance($group);
        $this->assertTrue($trialBalance['is_balanced']);
        $this->assertEquals($trialBalance['total_debits'], $trialBalance['total_credits']);
    }

    public function test_idempotent_journal_entries_no_duplicates(): void
    {
        $actor = $this->makeUser();
        $group = $this->makeGroup($actor);
        $membership = $this->makeMembership($group, $actor);
        $ledger = app(FinancialLedgerService::class);
        $ledger->setupChartOfAccounts($group, $actor);

        $cycle = $this->makeCycle($group, $actor);
        $payment = $this->makePayment($group, $cycle, $membership, $actor, '500.00');

        // Post twice — should only create one entry (idempotent)
        $entry1 = $ledger->postInitialDeposit($payment, $actor);
        $entry2 = $ledger->postInitialDeposit($payment, $actor);

        $this->assertCount(1, JournalEntry::where('equb_group_id', $group->id)->get());
        $this->assertEquals($entry1->id, $entry2->id);
    }

    public function test_general_ledger_returns_entries_ordered_by_date(): void
    {
        $actor = $this->makeUser();
        $group = $this->makeGroup($actor);
        $membership = $this->makeMembership($group, $actor);
        $ledger = app(FinancialLedgerService::class);
        $ledger->setupChartOfAccounts($group, $actor);

        $cycle = $this->makeCycle($group, $actor);
        foreach (['500.00', '1000.00'] as $amount) {
            $payment = $this->makePayment($group, $cycle, $membership, $actor, $amount);
            $ledger->postInitialDeposit($payment, $actor);
        }

        $entries = $ledger->getGeneralLedger($group);
        $this->assertCount(2, $entries);
        // Most recent first (highest id)
        $this->assertGreaterThanOrEqual($entries[1]->id, $entries[0]->id);
    }
}
