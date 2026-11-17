<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CycleStatus;
use App\Enums\DepositRoundStatus;
use App\Enums\PayoutCommencementRule;
use App\Enums\PayoutStatus;
use App\Enums\ReceiptType;
use App\Enums\RotationMethod;
use App\Models\ContributionObligation;
use App\Models\ContributionPeriod;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\Payout;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PayoutService
{
    public function __construct(
        protected AuditService $auditService,
        protected FinancialLedgerService $ledgerService,
        protected StatusWorkflowService $statusWorkflow
    ) {}

    // -------------------------------------------------------------------------
    // Commencement gate (Decision D-02)
    // -------------------------------------------------------------------------

    /**
     * Check all pre-conditions for commencing payouts.
     * Business rule: deposit stage must be complete before payout operations begin.
     */
    public function canCommencePayouts(EqubGroup $group): array
    {
        $reasons = [];
        $rule = $group->activeRule;
        $cycle = $group->activeCycle;

        if (! $cycle) {
            $reasons[] = 'No active Equb cycle found.';
        } elseif (! in_array($cycle->status, [CycleStatus::Ready, CycleStatus::Active], true)) {
            $reasons[] = "Cycle status is '{$cycle->status->label()}', must be 'Ready' or 'Active'.";
        }

        // 1. Initial deposit stage must be complete
        if ($rule && $rule->initial_deposit_rounds > 0) {
            $unclosedRounds = $group->depositRounds()
                ->where('status', '!=', DepositRoundStatus::Closed->value)
                ->count();

            if ($unclosedRounds > 0) {
                $reasons[] = "All {$rule->initial_deposit_rounds} initial deposit rounds must be closed and verified first "
                    ."({$unclosedRounds} round(s) remaining).";
            }
        }

        // 2. Date-based commencement check
        if ($rule && in_array($rule->payout_commencement_rule, [
            PayoutCommencementRule::DepositCompletionAndDate,
            PayoutCommencementRule::ScheduledDateOnly,
        ], true)) {
            if ($rule->payout_commencement_date && now()->startOfDay()->lessThan($rule->payout_commencement_date)) {
                $reasons[] = "Configured payout commencement date ({$rule->payout_commencement_date->toDateString()}) has not yet arrived.";
            }
        }

        // 3. Minimum members
        if ($group->activeMemberships()->count() < 2) {
            $reasons[] = 'Group requires at least 2 active members to schedule payout rotation.';
        }

        return [
            'can_commence' => empty($reasons),
            'reasons' => $reasons,
        ];
    }

    // -------------------------------------------------------------------------
    // Schedule rotation (predetermined only — lottery uses LotteryService)
    // -------------------------------------------------------------------------

    /**
     * Generate scheduled payout slots for predetermined rotation.
     * For lottery rotation, use LotteryService::conductDraw() + assignWinnerToPayout().
     */
    public function schedulePayoutRotation(EqubGroup $group, EqubCycle $cycle, User $actor): Collection
    {
        $check = $this->canCommencePayouts($group);
        if (! $check['can_commence']) {
            throw ValidationException::withMessages(['commencement' => $check['reasons']]);
        }

        $rule = $group->activeRule;

        if ($rule && $rule->rotation_method === RotationMethod::Lottery) {
            throw ValidationException::withMessages([
                'rotation' => ['This group uses lottery rotation. Use the Lottery Draw feature to assign each payout slot.'],
            ]);
        }

        return DB::transaction(function () use ($group, $cycle, $rule) {
            $memberships = $group->activeMemberships()
                ->with('memberProfile')
                ->orderBy('payout_order_number')
                ->get();

            $potAmount = (string) (((float) ($rule?->contribution_amount ?? 1000.00)) * $memberships->count());

            $periods = $group->contributionPeriods()->orderBy('sequence')->get();
            $payouts = new Collection;

            foreach ($memberships as $index => $membership) {
                $sequence = $index + 1;
                $period = $periods->firstWhere('sequence', $sequence);
                $scheduledOn = $period?->due_on ?? now()->addMonths($sequence)->toDateString();

                $payout = Payout::firstOrCreate(
                    ['equb_group_id' => $group->id, 'payout_sequence' => $sequence],
                    [
                        'equb_cycle_id' => $cycle->id,
                        'equb_membership_id' => $membership->id,
                        'member_profile_id' => $membership->member_profile_id,
                        'amount' => $potAmount,
                        'currency' => 'ETB',
                        'status' => PayoutStatus::Scheduled,
                        'scheduled_on' => $scheduledOn,
                    ]
                );

                $payouts->push($payout);
            }

            if ($cycle->status === CycleStatus::Ready) {
                $cycle->update(['status' => CycleStatus::Active, 'activated_on' => now()->toDateString()]);

                // Trigger cascading status updates
                $this->statusWorkflow->onPayoutScheduled($payouts->first());
            }

            $this->auditService->log(
                event: 'payouts.rotation_scheduled',
                auditable: $cycle,
                before: [],
                after: ['slots' => $payouts->count(), 'pot_amount' => $potAmount, 'method' => 'predetermined'],
                equbGroupId: $group->id
            );

            return $payouts;
        });
    }

    // -------------------------------------------------------------------------
    // Approval workflow (maker-checker)
    // -------------------------------------------------------------------------

    public function requestPayoutApproval(Payout $payout, User $requester): Payout
    {
        return DB::transaction(function () use ($payout, $requester) {
            if ($payout->status !== PayoutStatus::Scheduled) {
                throw ValidationException::withMessages([
                    'payout' => ["Payout slot #{$payout->payout_sequence} is already {$payout->status->label()}."],
                ]);
            }

            // Eligibility check at request time
            $this->assertMemberEligibleForPayout($payout);

            $payout->update([
                'status' => PayoutStatus::PendingApproval,
                'requested_by' => $requester->id,
                'eligibility_snapshot' => $this->buildEligibilitySnapshot($payout),
            ]);

            $this->auditService->log(
                event: 'payout.approval_requested',
                auditable: $payout,
                before: ['status' => PayoutStatus::Scheduled->value],
                after: ['status' => PayoutStatus::PendingApproval->value],
                equbGroupId: $payout->equb_group_id
            );

            return $payout->fresh();
        });
    }

    public function approvePayout(Payout $payout, User $approver): Payout
    {
        return DB::transaction(function () use ($payout, $approver) {
            // Maker-checker: approver cannot be requester (super-admin bypass)
            if ($payout->requested_by === $approver->id && ! $approver->isSuperAdmin()) {
                throw ValidationException::withMessages([
                    'approver' => ['Maker-checker violation: the user who requested payout approval cannot approve it.'],
                ]);
            }

            if ($payout->status !== PayoutStatus::PendingApproval) {
                throw ValidationException::withMessages([
                    'payout' => ['Payout must be in Pending Approval state to approve.'],
                ]);
            }

            $payout->update([
                'status' => PayoutStatus::Approved,
                'approved_by' => $approver->id,
                'approved_at' => now(),
            ]);

            $this->auditService->log(
                event: 'payout.approved',
                auditable: $payout,
                before: ['status' => PayoutStatus::PendingApproval->value],
                after: ['status' => PayoutStatus::Approved->value, 'approved_by' => $approver->id],
                equbGroupId: $payout->equb_group_id
            );

            return $payout->fresh();
        });
    }

    // -------------------------------------------------------------------------
    // Disbursement — the ONLY step that makes a payout "PAID"
    // -------------------------------------------------------------------------

    /**
     * Business rule (confirmed):
     * - Approval and actual disbursement must be separate.
     * - A payout becomes PAID only after actual disbursement is recorded.
     * - Separation of duties: approver ≠ disburser.
     * - Re-check eligibility inside the transaction with a lock.
     */
    public function disburse(Payout $payout, array $data, User $disbursedBy): Payout
    {
        return DB::transaction(function () use ($payout, $data, $disbursedBy) {
            // Lock the payout row to prevent race conditions
            $payout = Payout::lockForUpdate()->findOrFail($payout->id);

            if ($payout->status !== PayoutStatus::Approved) {
                throw ValidationException::withMessages([
                    'payout' => ['Payout must be in Approved state before disbursement.'],
                ]);
            }

            // Separation of duties: approver cannot disburse (super-admin bypass)
            if ($payout->approved_by === $disbursedBy->id && ! $disbursedBy->isSuperAdmin()) {
                throw ValidationException::withMessages([
                    'disburser' => ['Separation of duties: the user who approved this payout cannot disburse it.'],
                ]);
            }

            // Re-check eligibility at disbursement time (guard against status changes since approval)
            $this->assertMemberEligibleForPayout($payout);

            $payout->update([
                'status' => PayoutStatus::Disbursed,
                'method' => $data['method'] ?? 'bank_transfer',
                'account_reference' => $data['account_reference'] ?? null,
                'disbursed_on' => $data['disbursed_on'] ?? now()->toDateString(),
                'disbursement_reference' => $data['disbursement_reference'] ?? null,
                'disbursed_by' => $disbursedBy->id,
                'notes' => $data['notes'] ?? null,
            ]);

            // Issue receipt
            $year = date('Y');
            $count = Receipt::whereYear('created_at', $year)->count() + 1;
            Receipt::create([
                'receipt_number' => sprintf('REC-DISB-%s-%06d', $year, $count),
                'receipt_type' => ReceiptType::Payout,
                'receiptable_type' => Payout::class,
                'receiptable_id' => $payout->id,
                'equb_group_id' => $payout->equb_group_id,
                'member_profile_id' => $payout->member_profile_id,
                'amount' => $payout->amount,
                'currency' => $payout->currency,
                'issued_at' => now(),
                'issued_by_user_id' => $disbursedBy->id,
                'notes' => "Payout disbursement for Slot #{$payout->payout_sequence} — Ref: {$payout->disbursement_reference}",
            ]);

            // Post balanced journal entry (member BLUE status will reflect on next read)
            $this->ledgerService->postPayoutDisbursement($payout, $disbursedBy);

            $this->auditService->log(
                event: 'payout.disbursed',
                auditable: $payout,
                before: ['status' => PayoutStatus::Approved->value],
                after: ['status' => PayoutStatus::Disbursed->value, 'disbursed_by' => $disbursedBy->id],
                equbGroupId: $payout->equb_group_id
            );

            // Trigger cascading status updates (member color change)
            $this->statusWorkflow->onPayoutDisbursed($payout);

            return $payout->fresh();
        });
    }

    /**
     * Final payout closure.
     *
     * Business rule (confirmed): disbursement and completion are distinct states.
     * A payout becomes Disbursed once money leaves the fund, and is only marked
     * Completed after the disbursement has been reconciled/confirmed. Both states
     * count as "paid" for BLUE member classification.
     */
    public function complete(Payout $payout, User $actor): Payout
    {
        return DB::transaction(function () use ($payout, $actor) {
            $payout = Payout::lockForUpdate()->findOrFail($payout->id);

            if ($payout->status !== PayoutStatus::Disbursed) {
                throw ValidationException::withMessages([
                    'payout' => ['Payout must be in Disbursed state before it can be completed.'],
                ]);
            }

            $payout->update([
                'status' => PayoutStatus::Completed,
                'completed_at' => now(),
            ]);

            $this->auditService->log(
                event: 'payout.completed',
                auditable: $payout,
                before: ['status' => PayoutStatus::Disbursed->value],
                after: ['status' => PayoutStatus::Completed->value, 'completed_by' => $actor->id],
                equbGroupId: $payout->equb_group_id
            );

            return $payout->fresh();
        });
    }

    // -------------------------------------------------------------------------
    // Query helpers
    // -------------------------------------------------------------------------

    public function getPayoutSchedule(EqubGroup $group): Collection
    {
        return $group->payouts()
            ->with(['memberProfile', 'membership', 'requester', 'approver', 'disburser', 'lotteryDraw'])
            ->orderBy('payout_sequence')
            ->get();
    }

    // -------------------------------------------------------------------------
    // Eligibility enforcement
    // -------------------------------------------------------------------------

    /**
     * Business rule (confirmed): Selected winners must pass eligibility checks.
     * Checks run at both request-approval time AND disbursement time.
     */
    private function assertMemberEligibleForPayout(Payout $payout): void
    {
        $membership = $payout->membership;

        if (! $membership) {
            throw ValidationException::withMessages(['eligibility' => ['Membership record not found.']]);
        }

        // 1. Must be an active membership
        if ($membership->status->value !== 'active') {
            throw ValidationException::withMessages([
                'eligibility' => ["Member {$membership->memberProfile?->full_name} is not in active status ({$membership->status->value})."],
            ]);
        }

        // 2. Must NOT have already received a payout in this cycle
        $alreadyPaid = Payout::where('equb_membership_id', $payout->equb_membership_id)
            ->where('equb_cycle_id', $payout->equb_cycle_id)
            ->whereIn('status', [PayoutStatus::Disbursed->value, PayoutStatus::Completed->value])
            ->where('id', '!=', $payout->id)
            ->exists();

        if ($alreadyPaid) {
            throw ValidationException::withMessages([
                'eligibility' => ['This member has already received a payout in this cycle. Only one payout per cycle is allowed.'],
            ]);
        }

        // 3. Current contribution must be verified (business rule confirmed)
        $cycle = $payout->cycle ?? $membership->group?->activeCycle;
        if ($cycle) {
            $currentPeriod = ContributionPeriod::where('equb_cycle_id', $cycle->id)
                ->where('status', 'open')
                ->orderByDesc('sequence')
                ->first();

            if ($currentPeriod) {
                $obligation = ContributionObligation::where('contribution_period_id', $currentPeriod->id)
                    ->where('equb_membership_id', $membership->id)
                    ->first();

                if (! $obligation || $obligation->status !== 'verified') {
                    throw ValidationException::withMessages([
                        'eligibility' => ['Member must have their current contribution fully verified before receiving a payout.'],
                    ]);
                }
            }
        }
    }

    private function buildEligibilitySnapshot(Payout $payout): array
    {
        $membership = $payout->membership?->load('memberProfile');

        return [
            'checked_at' => now()->toIso8601String(),
            'membership_id' => $payout->equb_membership_id,
            'membership_status' => $membership?->status->value,
            'cycle_id' => $payout->equb_cycle_id,
            'checks_passed' => ['active_membership', 'no_duplicate_payout', 'contribution_verified'],
        ];
    }
}
