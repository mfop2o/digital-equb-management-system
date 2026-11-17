<?php

declare(strict_types=1);

namespace Tests\Feature\Lottery;

use App\Enums\ContributionFrequency;
use App\Enums\CycleStatus;
use App\Enums\GroupStatus;
use App\Enums\InitialDepositTreatment;
use App\Enums\MembershipStatus;
use App\Enums\PayoutCommencementRule;
use App\Enums\PayoutStatus;
use App\Enums\RotationMethod;
use App\Models\ContributionObligation;
use App\Models\ContributionPeriod;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\EqubGroupRule;
use App\Models\EqubMembership;
use App\Models\LotteryDraw;
use App\Models\MemberProfile;
use App\Models\Payout;
use App\Models\User;
use App\Services\LotteryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LotteryServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $actor;

    private EqubGroup $group;

    private EqubCycle $cycle;

    private ContributionPeriod $period;

    /** @var array<int, EqubMembership> */
    private array $memberships = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->actor = User::factory()->create(['must_change_password' => false]);

        $this->group = EqubGroup::create([
            'name' => 'Lottery Test Equb',
            'group_code' => 'GRP-'.Str::upper(Str::random(8)),
            'status' => GroupStatus::Active,
            'max_members' => 10,
            'created_by_user_id' => $this->actor->id,
        ]);

        EqubGroupRule::create([
            'equb_group_id' => $this->group->id,
            'contribution_amount' => '1000.00',
            'contribution_frequency' => ContributionFrequency::Monthly,
            'expected_members' => 3,
            'initial_deposit_rounds' => 0,
            'initial_deposit_amount' => '0.00',
            'initial_deposit_treatment' => InitialDepositTreatment::Retained,
            'payout_commencement_rule' => PayoutCommencementRule::DepositCompletionOnly,
            'rotation_method' => RotationMethod::Lottery,
            'allow_partial_contributions' => false,
            'is_active' => true,
            'version' => 1,
            'configured_by_user_id' => $this->actor->id,
        ]);

        $this->cycle = EqubCycle::create([
            'equb_group_id' => $this->group->id,
            'cycle_number' => 1,
            'status' => CycleStatus::Active,
            'started_on' => now()->toDateString(),
            'created_by' => $this->actor->id,
        ]);

        $this->period = ContributionPeriod::create([
            'equb_group_id' => $this->group->id,
            'equb_cycle_id' => $this->cycle->id,
            'sequence' => 1,
            'label' => 'Contribution Round 1',
            'opens_on' => now()->subDays(5)->toDateString(),
            'due_on' => now()->addDays(5)->toDateString(),
            'closes_on' => now()->addDays(7)->toDateString(),
            'status' => 'open',
            'amount_due_snapshot' => '1000.00',
            'grace_days_snapshot' => 0,
        ]);
    }

    private function makeMembership(string $name = 'Member'): EqubMembership
    {
        $profile = MemberProfile::create([
            'member_number' => 'MEM-'.Str::upper(Str::random(8)),
            'first_name' => $name,
            'middle_name' => 'Test',
            'last_name' => 'Equb',
            'phone' => '09'.random_int(10000000, 99999999),
            'created_by_user_id' => $this->actor->id,
        ]);

        return EqubMembership::create([
            'equb_group_id' => $this->group->id,
            'member_profile_id' => $profile->id,
            'membership_number' => 'MBR-'.Str::upper(Str::random(8)),
            'role' => 'member',
            'status' => MembershipStatus::Active,
            'joined_at' => now(),
        ]);
    }

    private function makeMembershipWithObligation(string $name, string $status, ?string $dueOn = null, int $graceDays = 0): EqubMembership
    {
        $membership = $this->makeMembership($name);

        ContributionObligation::create([
            'contribution_period_id' => $this->period->id,
            'equb_membership_id' => $membership->id,
            'member_profile_id' => $membership->member_profile_id,
            'amount_due' => '1000.00',
            'amount_paid' => $status === 'verified' ? '1000.00' : '0.00',
            'due_on' => $dueOn ?? now()->addDays(5)->toDateString(),
            'grace_days' => $graceDays,
            'status' => $status,
            'generated_at' => now(),
        ]);

        return $membership;
    }

    private function markPayoutDisbursed(EqubMembership $membership, int $sequence = 1): Payout
    {
        return Payout::create([
            'equb_group_id' => $this->group->id,
            'equb_cycle_id' => $this->cycle->id,
            'equb_membership_id' => $membership->id,
            'member_profile_id' => $membership->member_profile_id,
            'payout_sequence' => $sequence,
            'amount' => '3000.00',
            'currency' => 'ETB',
            'status' => PayoutStatus::Disbursed,
            'disbursed_on' => now()->toDateString(),
            'disbursed_by' => $this->actor->id,
        ]);
    }

    public function test_only_members_with_verified_current_contribution_are_eligible(): void
    {
        $eligible = $this->makeMembershipWithObligation('Verified', 'verified');
        $this->makeMembershipWithObligation('Pending', 'pending');
        $this->makeMembershipWithObligation('Submitted', 'submitted');

        $service = app(LotteryService::class);
        $participants = $service->getEligibleParticipants($this->group, $this->cycle);

        $this->assertCount(1, $participants);
        $this->assertSame($eligible->id, $participants->first()->id);
    }

    public function test_members_with_overdue_obligations_are_excluded(): void
    {
        $verified = $this->makeMembershipWithObligation('Verified', 'verified');
        $this->makeMembershipWithObligation(
            'Overdue',
            'pending',
            now()->subDays(10)->toDateString(),
            2
        );

        $service = app(LotteryService::class);
        $participants = $service->getEligibleParticipants($this->group, $this->cycle);

        $this->assertCount(1, $participants);
        $this->assertSame($verified->id, $participants->first()->id);
    }

    public function test_previous_winners_are_excluded_from_subsequent_draws(): void
    {
        $winner = $this->makeMembershipWithObligation('Winner', 'verified');
        $other = $this->makeMembershipWithObligation('Other', 'verified');

        $this->markPayoutDisbursed($winner, 1);

        $service = app(LotteryService::class);
        $participants = $service->getEligibleParticipants($this->group, $this->cycle);

        $this->assertCount(1, $participants);
        $this->assertSame($other->id, $participants->first()->id);
    }

    public function test_one_draw_per_payout_sequence_and_results_are_immutable(): void
    {
        $this->makeMembershipWithObligation('First', 'verified');
        $this->makeMembershipWithObligation('Second', 'verified');

        $service = app(LotteryService::class);

        $draw = $service->conductDraw($this->group, $this->cycle, 1, $this->actor);
        $this->assertTrue($draw->isConfirmed());
        $this->assertNotNull($draw->result_hash);

        $this->expectException(ValidationException::class);

        // A confirmed draw must not be silently replaced for the same slot
        $service->conductDraw($this->group, $this->cycle, 1, $this->actor);
    }

    public function test_draw_records_participants_winner_evidence_and_audit(): void
    {
        $this->makeMembershipWithObligation('Eligible A', 'verified');
        $this->makeMembershipWithObligation('Eligible B', 'verified');
        $this->makeMembershipWithObligation('Ineligible', 'pending');

        $service = app(LotteryService::class);
        $draw = $service->conductDraw(
            group: $this->group,
            cycle: $this->cycle,
            payoutSequence: 1,
            conductor: $this->actor,
            witnessedByName: 'Witness One',
            witnessedByRole: 'Auditor',
            notes: 'Drawn at the group meeting',
        );

        $this->assertSame(2, $draw->eligible_count);
        $this->assertCount(2, $draw->eligible_participants);
        $this->assertNotNull($draw->winning_membership_id);
        $this->assertNotNull($draw->random_seed);
        $this->assertSame('random_server', $draw->draw_method);
        $this->assertSame('Witness One', $draw->witnessed_by_name);
        $this->assertTrue($draw->isConfirmed());

        // Every active membership is recorded, including exclusions and reasons.
        $this->assertCount(3, $draw->participants);
        $this->assertSame(2, $draw->participants->where('is_eligible', true)->count());
        $this->assertSame(1, $draw->participants->where('is_eligible', false)->count());
        $this->assertNotNull(
            $draw->participants->firstWhere('is_eligible', false)->exclusion_reason
        );

        $this->assertDatabaseHas('audit_logs', [
            'event' => 'lottery_draw.conducted',
            'auditable_id' => $draw->id,
            'equb_group_id' => $this->group->id,
        ]);
    }

    public function test_assigning_winner_creates_a_scheduled_payout_not_a_paid_payout(): void
    {
        $this->makeMembershipWithObligation('Solo', 'verified');

        $service = app(LotteryService::class);
        $draw = $service->conductDraw($this->group, $this->cycle, 1, $this->actor);
        $payout = $service->assignWinnerToPayout($draw, $this->actor);

        $this->assertEquals(PayoutStatus::Scheduled, $payout->status);
        $this->assertFalse($payout->status->isConsideredPaid());
        $this->assertSame($draw->id, $payout->lottery_draw_id);
        $this->assertSame($draw->winning_membership_id, $payout->equb_membership_id);
        $this->assertFalse($draw->winningMembership->hasReceivedPayout($this->cycle->id));
    }

    public function test_each_member_receives_exactly_one_payout_per_cycle(): void
    {
        $first = $this->makeMembershipWithObligation('First', 'verified');
        $second = $this->makeMembershipWithObligation('Second', 'verified');

        $service = app(LotteryService::class);

        // Draw slot 1 and mark its winner paid.
        $draw1 = $service->conductDraw($this->group, $this->cycle, 1, $this->actor);
        $payout1 = $service->assignWinnerToPayout($draw1, $this->actor);
        $winner1 = $draw1->winning_membership_id;

        $payout1->update([
            'status' => PayoutStatus::Disbursed,
            'disbursed_on' => now()->toDateString(),
            'disbursed_by' => $this->actor->id,
        ]);

        // Draw slot 2 — the first winner must be excluded now.
        $draw2 = $service->conductDraw($this->group, $this->cycle, 2, $this->actor);
        $winner2 = $draw2->winning_membership_id;

        $this->assertNotSame($winner1, $winner2);
        $this->assertSame(
            [$first->id, $second->id],
            collect([$winner1, $winner2])->sort()->values()->all()
        );
        $this->assertCount(2, LotteryDraw::where('equb_cycle_id', $this->cycle->id)->get());
    }
}
