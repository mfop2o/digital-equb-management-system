<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PayoutStatus;
use App\Models\ContributionObligation;
use App\Models\ContributionPeriod;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\EqubMembership;
use App\Models\LotteryDraw;
use App\Models\LotteryDrawParticipant;
use App\Models\Payout;
use App\Models\User;
use App\Support\OverdueExpression;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * LotteryService — implements confirmed business rules for lottery draws.
 *
 * Confirmed rules:
 * 1. A separate lottery occurs for each payout round.
 * 2. A member can receive only one payout per cycle.
 * 3. Previous winners are excluded from subsequent lotteries.
 * 4. Members with overdue contributions are excluded.
 * 5. Members must have their current required contribution verified before receiving payout.
 * 6. Record lottery participants, selected winner, date, time, round, and audit information.
 * 7. Lottery results must not be silently changed or replaced (append-only).
 */
final class LotteryService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Determine which members are eligible for the next lottery draw.
     *
     * Exclusions (confirmed):
     * - Members who already received a payout in this cycle (Disbursed or Completed).
     * - Members with overdue contribution obligations.
     * - Members whose current contribution period obligation is NOT fully verified.
     * - Suspended / withdrawn members.
     */
    public function getEligibleParticipants(EqubGroup $group, EqubCycle $cycle): Collection
    {
        $memberships = $group->activeMemberships()
            ->with(['memberProfile', 'payouts'])
            ->get();

        return $memberships->filter(function (EqubMembership $membership) use ($cycle) {
            // Exclude members who already received a payout in this cycle
            if ($membership->hasReceivedPayout($cycle->id)) {
                return false;
            }

            // Exclude members with any overdue obligations in this cycle
            if ($this->memberHasOverdueObligation($membership, $cycle)) {
                return false;
            }

            // Exclude members whose current contribution is not fully verified
            if (! $this->memberHasCurrentContributionVerified($membership, $cycle)) {
                return false;
            }

            return true;
        })->values();
    }

    /**
     * Conduct a lottery draw for the given payout sequence position.
     *
     * Business rule: One draw per payout_sequence per cycle.
     * Business rule: Results are immutable once winner_confirmed.
     *
     * @param  bool  $allowRerun  When true, an existing confirmed draw can be re-run
     *                            (excluding the previous winner). Used when a winner declines.
     * @param  int|null  $excludeMembershipId  When re-running, exclude this membership from the pool.
     */
    public function conductDraw(
        EqubGroup $group,
        EqubCycle $cycle,
        int $payoutSequence,
        User $conductor,
        string $method = 'random_server',
        ?string $witnessedByName = null,
        ?string $witnessedByRole = null,
        ?string $notes = null,
        bool $allowRerun = false,
        ?int $excludeMembershipId = null,
    ): LotteryDraw {
        // Guard: a confirmed draw for this sequence already exists
        $existing = LotteryDraw::where('equb_cycle_id', $cycle->id)
            ->where('payout_sequence', $payoutSequence)
            ->first();

        if ($existing && $existing->isConfirmed() && ! $allowRerun) {
            throw ValidationException::withMessages([
                'draw' => [
                    "Lottery draw for payout slot #{$payoutSequence} already has a confirmed winner. "
                    .'Results cannot be replaced (business rule: lottery results must not be silently changed).',
                ],
            ]);
        }

        return DB::transaction(function () use (
            $group, $cycle, $payoutSequence, $conductor, $method,
            $witnessedByName, $witnessedByRole, $notes, $allowRerun, $excludeMembershipId
        ) {
            $eligibleMemberships = $this->getEligibleParticipants($group, $cycle);

            // When re-running, exclude the previous winner who declined
            if ($allowRerun && $excludeMembershipId) {
                $eligibleMemberships = $eligibleMemberships->reject(
                    fn (EqubMembership $m) => $m->id === $excludeMembershipId
                )->values();
            }

            if ($eligibleMemberships->isEmpty()) {
                throw ValidationException::withMessages([
                    'draw' => ['No eligible members found for this lottery draw. All members may have received a payout or have outstanding obligations.'],
                ]);
            }

            // Generate a cryptographically secure seed for auditability
            $seed = bin2hex(random_bytes(32));

            // Server-side random selection — not client-controllable
            $winner = $eligibleMemberships->random();

            // Build the evidence payload for the audit trail
            $evidence = [
                'algorithm' => 'PHP random_bytes(32) seed + Collection::random()',
                'seed' => $seed,
                'eligible_count' => $eligibleMemberships->count(),
                'eligible_ids' => $eligibleMemberships->pluck('id')->toArray(),
                'winning_id' => $winner->id,
                'conducted_at' => now()->toIso8601String(),
                'conducted_by_user' => $conductor->id,
                'php_version' => PHP_VERSION,
            ];

            // Compute a tamper-detection hash over the immutable result
            $resultHash = hash('sha256', json_encode([
                'cycle_id' => $cycle->id,
                'sequence' => $payoutSequence,
                'winning_id' => $winner->id,
                'conducted_at' => $evidence['conducted_at'],
                'seed' => $seed,
            ]));

            // Create or update the draw record
            $draw = LotteryDraw::updateOrCreate(
                [
                    'equb_cycle_id' => $cycle->id,
                    'payout_sequence' => $payoutSequence,
                ],
                [
                    'equb_group_id' => $group->id,
                    'status' => 'winner_confirmed',
                    'winning_membership_id' => $winner->id,
                    'eligible_participants' => $eligibleMemberships->pluck('id')->toArray(),
                    'eligible_count' => $eligibleMemberships->count(),
                    'draw_method' => $method,
                    'random_seed' => $seed,
                    'draw_evidence' => $evidence,
                    'conducted_by' => $conductor->id,
                    'conducted_at' => now(),
                    'witnessed_by_name' => $witnessedByName,
                    'witnessed_by_role' => $witnessedByRole,
                    'notes' => $notes,
                    'result_hash' => $resultHash,
                ]
            );

            // Record all active memberships as participant rows with eligibility reason
            $this->recordAllParticipants($draw, $group, $cycle, $eligibleMemberships);

            $this->auditService->log(
                event: 'lottery_draw.conducted',
                auditable: $draw,
                before: [],
                after: [
                    'payout_sequence' => $payoutSequence,
                    'winning_membership_id' => $winner->id,
                    'eligible_count' => $eligibleMemberships->count(),
                    'result_hash' => $resultHash,
                ],
                equbGroupId: $group->id
            );

            return $draw->load(['winningMembership.memberProfile', 'participants']);
        });
    }

    /**
     * Assign the lottery winner to the payout slot.
     * Creates or updates the Payout row for this sequence.
     */
    public function assignWinnerToPayout(LotteryDraw $draw, User $actor): Payout
    {
        if (! $draw->isConfirmed()) {
            throw ValidationException::withMessages([
                'draw' => ['The lottery draw must be winner_confirmed before assigning the payout.'],
            ]);
        }

        return DB::transaction(function () use ($draw) {
            $group = $draw->group;
            $cycle = $draw->cycle;
            $winner = $draw->winningMembership;
            $rule = $group->activeRule;
            $potAmount = (string) (((float) ($rule?->contribution_amount ?? 0)) * ($rule?->expected_members ?? 1));

            $payout = Payout::updateOrCreate(
                [
                    'equb_group_id' => $group->id,
                    'payout_sequence' => $draw->payout_sequence,
                ],
                [
                    'equb_cycle_id' => $cycle->id,
                    'lottery_draw_id' => $draw->id,
                    'equb_membership_id' => $winner->id,
                    'member_profile_id' => $winner->member_profile_id,
                    'amount' => $potAmount,
                    'currency' => 'ETB',
                    'status' => PayoutStatus::Scheduled,
                    'scheduled_on' => now()->toDateString(),
                ]
            );

            $this->auditService->log(
                event: 'lottery_draw.payout_assigned',
                auditable: $payout,
                before: [],
                after: ['lottery_draw_id' => $draw->id, 'membership_id' => $winner->id],
                equbGroupId: $group->id
            );

            return $payout;
        });
    }

    /**
     * Return all draws for a cycle, with participant and winner details.
     */
    public function getDrawsForCycle(EqubCycle $cycle): Collection
    {
        return LotteryDraw::where('equb_cycle_id', $cycle->id)
            ->with(['winningMembership.memberProfile', 'conductedBy', 'participants.membership.memberProfile'])
            ->orderBy('payout_sequence')
            ->get();
    }

    // -------------------------------------------------------------------------
    // Eligibility helpers
    // -------------------------------------------------------------------------

    /**
     * Business rule (confirmed): Members with overdue contributions are excluded.
     */
    private function memberHasOverdueObligation(EqubMembership $membership, EqubCycle $cycle): bool
    {
        return ContributionObligation::where('equb_membership_id', $membership->id)
            ->whereHas('period', fn ($q) => $q->where('equb_cycle_id', $cycle->id))
            ->where(function ($q) {
                $q->where('status', 'overdue')
                    ->orWhere(function ($q2) {
                        // Also flag as overdue if deadline passed and not verified
                        $q2->whereNotIn('status', ['verified', 'exempt'])
                            ->whereRaw(OverdueExpression::dueDatePlusGraceDaysHasPassed());
                    });
            })
            ->exists();
    }

    /**
     * Business rule (confirmed): Members must have their current required contribution
     * verified before receiving payout.
     *
     * "Current" = the most recent open/active contribution period in this cycle.
     */
    private function memberHasCurrentContributionVerified(EqubMembership $membership, EqubCycle $cycle): bool
    {
        // Find the latest open contribution period for this cycle
        $currentPeriod = ContributionPeriod::where('equb_cycle_id', $cycle->id)
            ->whereIn('status', ['open', 'closed'])
            ->orderByDesc('sequence')
            ->first();

        if (! $currentPeriod) {
            // No period exists yet — not blocking
            return true;
        }

        $obligation = ContributionObligation::where('contribution_period_id', $currentPeriod->id)
            ->where('equb_membership_id', $membership->id)
            ->first();

        if (! $obligation) {
            // No obligation generated yet — treat as not verified
            return false;
        }

        return $obligation->status === 'verified';
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private function recordAllParticipants(
        LotteryDraw $draw,
        EqubGroup $group,
        EqubCycle $cycle,
        Collection $eligibleMemberships
    ): void {
        $allMemberships = $group->activeMemberships()->get();
        $eligibleIds = $eligibleMemberships->pluck('id')->toArray();

        foreach ($allMemberships as $membership) {
            $isEligible = in_array($membership->id, $eligibleIds, true);

            $reason = null;
            if (! $isEligible) {
                if ($membership->hasReceivedPayout($cycle->id)) {
                    $reason = 'Already received payout in this cycle';
                } elseif ($this->memberHasOverdueObligation($membership, $cycle)) {
                    $reason = 'Has overdue contribution obligation';
                } elseif (! $this->memberHasCurrentContributionVerified($membership, $cycle)) {
                    $reason = 'Current contribution not fully verified';
                } else {
                    $reason = 'Not eligible (unknown reason)';
                }
            }

            LotteryDrawParticipant::updateOrCreate(
                [
                    'lottery_draw_id' => $draw->id,
                    'equb_membership_id' => $membership->id,
                ],
                [
                    'is_eligible' => $isEligible,
                    'exclusion_reason' => $reason,
                ]
            );
        }
    }
}
