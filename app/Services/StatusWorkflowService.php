<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CycleStatus;
use App\Enums\DepositObligationStatus;
use App\Enums\DepositRoundStatus;
use App\Enums\GroupStatus;
use App\Enums\PayoutStatus;
use App\Models\DepositObligation;
use App\Models\DepositRound;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\Payment;
use App\Models\Payout;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * StatusWorkflowService - Manages cascading status transitions across the Equb system.
 *
 * Status Hierarchy (confirmed business rules):
 *
 * GROUP STATUS FLOW:
 * Draft → Registration → DepositStage → Active → Completed
 *                                 ↘ Suspended → Active (resume)
 *                                 ↘ Cancelled (terminal)
 *
 * CYCLE STATUS FLOW:
 * Planned → DepositStage → Ready → Active → Closing → Closed
 *                                           ↘ Cancelled (terminal)
 *
 * DEPOSIT ROUND STATUS FLOW:
 * Pending → Open → Closed
 *                 ↘ Cancelled (terminal)
 *
 * DEPOSIT OBLIGATION STATUS FLOW:
 * Pending → Submitted → Verified
 *         ↘ Overdue (can return to Pending)
 *         ↘ Exempt (terminal)
 *
 * CONTRIBUTION OBLIGATION STATUS FLOW:
 * Pending → Submitted → Verified
 *         ↘ Overdue (can return to Pending)
 *
 * PAYMENT STATUS FLOW:
 * Submitted → UnderReview → Verified
 *           ↘ Rejected → Submitted (re-record)
 *           ↘ Cancelled (terminal)
 *           ↘ Reversed (terminal)
 *
 * PAYOUT STATUS FLOW:
 * Scheduled → PendingApproval → Approved → Disbursed → Completed
 *                                               ↘ Cancelled
 *                                               ↘ Reversed
 *
 * CASCADED TRANSITIONS:
 * 1. When ALL deposit rounds closed → Cycle status: DepositStage → Ready
 * 2. When ALL cycles ready → Group status: DepositStage → Active
 * 3. When ALL obligations verified → Round/Period can close
 * 4. When payout disbursed → Member color changes to BLUE
 * 5. When contribution verified → Member becomes lottery eligible
 */
final class StatusWorkflowService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Handle cascading status updates when a payment is verified.
     */
    public function onPaymentVerified(Payment $payment, int $verifierId): void
    {
        DB::transaction(function () use ($payment) {
            // Update obligation status
            $this->updateObligationStatuses($payment);

            // Check if round/period can be closed
            if ($payment->payment_type->value === 'deposit') {
                $this->checkDepositRoundCompletion($payment);
            } else {
                $this->checkContributionPeriodCompletion($payment);
            }

            // Check if cycle should advance
            $this->checkCycleAdvancement($payment->group);

            // Check if group should advance
            $this->checkGroupAdvancement($payment->group);

            Log::info('StatusWorkflow: Payment verified cascades completed', [
                'payment_id' => $payment->id,
                'group_id' => $payment->equb_group_id,
            ]);
        });
    }

    /**
     * Update obligation statuses when payment is verified.
     */
    protected function updateObligationStatuses(Payment $payment): void
    {
        foreach ($payment->allocations as $allocation) {
            if ($allocation->depositObligation) {
                $allocation->depositObligation->update([
                    'status' => DepositObligationStatus::Verified,
                    'amount_paid' => $allocation->depositObligation->amount_due,
                ]);
            }
            if ($allocation->contributionObligation) {
                $allocation->contributionObligation->update([
                    'status' => 'verified',
                    'amount_paid' => $allocation->contributionObligation->amount_due,
                ]);
            }
        }
    }

    /**
     * Check if a deposit round can be closed after payment verification.
     */
    protected function checkDepositRoundCompletion(Payment $payment): void
    {
        $allocation = $payment->allocations->firstWhere('deposit_obligation_id', '!=', null);
        if (! $allocation?->depositObligation) {
            return;
        }

        $round = $allocation->depositObligation->round;
        if (! $round || $round->status !== DepositRoundStatus::Open) {
            return;
        }

        // Check if all obligations are verified
        $unverifiedCount = $round->obligations()
            ->where('is_exempt', false)
            ->where('status', '!=', DepositObligationStatus::Verified->value)
            ->count();

        // If all verified, we DON'T auto-close - let admin decide
        // But we log that it's ready for closure
        if ($unverifiedCount === 0) {
            Log::info('StatusWorkflow: Deposit round ready for closure', [
                'round_id' => $round->id,
                'round_label' => $round->label,
            ]);
        }
    }

    /**
     * Check if a contribution period can be closed after payment verification.
     */
    protected function checkContributionPeriodCompletion(Payment $payment): void
    {
        $allocation = $payment->allocations->firstWhere('contribution_obligation_id', '!=', null);
        if (! $allocation?->contributionObligation) {
            return;
        }

        $period = $allocation->contributionObligation->period;
        if (! $period || $period->status !== 'open') {
            return;
        }

        // Check if all obligations are verified
        $unverifiedCount = $period->obligations()
            ->where('status', '!=', 'verified')
            ->count();

        if ($unverifiedCount === 0) {
            Log::info('StatusWorkflow: Contribution period ready for closure', [
                'period_id' => $period->id,
                'period_label' => $period->label,
            ]);
        }
    }

    /**
     * Check if the cycle should advance to the next status.
     */
    protected function checkCycleAdvancement(EqubGroup $group): void
    {
        $cycle = $group->activeCycle;
        if (! $cycle) {
            return;
        }

        // If in deposit stage, check if all rounds are closed
        if ($cycle->status === CycleStatus::DepositStage) {
            $activeRule = $group->activeRule;
            $configuredRounds = $activeRule?->initial_deposit_rounds ?? 0;

            if ($configuredRounds > 0) {
                $closedRoundsCount = $group->depositRounds()
                    ->where('status', DepositRoundStatus::Closed->value)
                    ->count();

                if ($closedRoundsCount >= $configuredRounds) {
                    $cycle->update([
                        'status' => CycleStatus::Ready,
                        'deposit_stage_closed_on' => now()->toDateString(),
                    ]);

                    $this->auditService->log(
                        event: 'cycle.status_advanced',
                        auditable: $cycle,
                        before: ['status' => CycleStatus::DepositStage->value],
                        after: ['status' => CycleStatus::Ready->value, 'reason' => 'All deposit rounds closed'],
                        equbGroupId: $group->id
                    );
                }
            }
        }

        // If ready and first payout scheduled, advance to active
        if ($cycle->status === CycleStatus::Ready) {
            $scheduledPayouts = Payout::where('equb_cycle_id', $cycle->id)
                ->where('status', PayoutStatus::Scheduled->value)
                ->count();

            if ($scheduledPayouts > 0) {
                $cycle->update(['status' => CycleStatus::Active]);

                $this->auditService->log(
                    event: 'cycle.status_advanced',
                    auditable: $cycle,
                    before: ['status' => CycleStatus::Ready->value],
                    after: ['status' => CycleStatus::Active->value, 'reason' => 'Payouts scheduled'],
                    equbGroupId: $group->id
                );
            }
        }
    }

    /**
     * Check if the group should advance to the next status.
     */
    protected function checkGroupAdvancement(EqubGroup $group): void
    {
        // If in deposit stage, check if cycle is ready
        if ($group->status === GroupStatus::DepositStage) {
            $cycle = $group->activeCycle;
            if ($cycle && in_array($cycle->status, [CycleStatus::Ready, CycleStatus::Active], true)) {
                $group->update(['status' => GroupStatus::Active]);

                $this->auditService->log(
                    event: 'group.status_advanced',
                    auditable: $group,
                    before: ['status' => GroupStatus::DepositStage->value],
                    after: ['status' => GroupStatus::Active->value, 'reason' => 'Cycle ready for payouts'],
                    equbGroupId: $group->id
                );
            }
        }
    }

    /**
     * Handle status changes when a deposit round is closed.
     */
    public function onDepositRoundClosed(DepositRound $round): void
    {
        DB::transaction(function () use ($round) {
            $group = $round->group;
            $cycle = $group->activeCycle;

            if (! $cycle) {
                return;
            }

            $activeRule = $group->activeRule;
            $configuredRounds = $activeRule?->initial_deposit_rounds ?? 0;

            if ($configuredRounds === 0) {
                // No deposit rounds configured, cycle is ready immediately
                $cycle->update(['status' => CycleStatus::Ready]);

                return;
            }

            $closedRoundsCount = $group->depositRounds()
                ->where('status', DepositRoundStatus::Closed->value)
                ->count();

            if ($closedRoundsCount >= $configuredRounds && $cycle->status === CycleStatus::DepositStage) {
                $cycle->update([
                    'status' => CycleStatus::Ready,
                    'deposit_stage_closed_on' => now()->toDateString(),
                ]);

                $this->auditService->log(
                    event: 'cycle.deposit_stage_completed',
                    auditable: $cycle,
                    before: ['status' => CycleStatus::DepositStage->value],
                    after: ['status' => CycleStatus::Ready->value],
                    equbGroupId: $group->id
                );

                // Check if group should advance
                $this->checkGroupAdvancement($group);
            }
        });
    }

    /**
     * Handle status changes when a payout is scheduled.
     */
    public function onPayoutScheduled(Payout $payout): void
    {
        DB::transaction(function () use ($payout) {
            $cycle = $payout->cycle;
            if (! $cycle) {
                return;
            }

            // If cycle is ready and first payout scheduled, activate it
            if ($cycle->status === CycleStatus::Ready) {
                $cycle->update(['status' => CycleStatus::Active]);

                $this->auditService->log(
                    event: 'cycle.activated',
                    auditable: $cycle,
                    before: ['status' => CycleStatus::Ready->value],
                    after: ['status' => CycleStatus::Active->value],
                    equbGroupId: $payout->equb_group_id
                );

                // Check if group should advance
                $this->checkGroupAdvancement($payout->group);
            }
        });
    }

    /**
     * Handle status changes when a payout is disbursed.
     */
    public function onPayoutDisbursed(Payout $payout): void
    {
        DB::transaction(function () use ($payout) {
            $membership = $payout->membership;
            if (! $membership) {
                return;
            }

            // Update member color to BLUE (already received payout)
            $membership->update(['member_color' => 'blue']);

            $this->auditService->log(
                event: 'membership.color_changed',
                auditable: $membership,
                before: ['member_color' => $membership->getOriginal('member_color')],
                after: ['member_color' => 'blue', 'reason' => 'Payout disbursed'],
                equbGroupId: $payout->equb_group_id
            );
        });
    }

    /**
     * Handle status changes when a group is activated.
     */
    public function onGroupActivated(EqubGroup $group): void
    {
        DB::transaction(function () use ($group) {
            // Create or get active cycle
            $cycle = $group->activeCycle;
            if (! $cycle) {
                $cycle = EqubCycle::create([
                    'equb_group_id' => $group->id,
                    'cycle_number' => 1,
                    'status' => CycleStatus::DepositStage,
                    'started_on' => now()->toDateString(),
                    'created_by' => auth()->id(),
                ]);

                $this->auditService->log(
                    event: 'cycle.created',
                    auditable: $cycle,
                    after: ['cycle_number' => 1, 'status' => CycleStatus::DepositStage->value],
                    equbGroupId: $group->id
                );
            }

            // Check if we need deposit stage
            $activeRule = $group->activeRule;
            if ($activeRule && $activeRule->initial_deposit_rounds > 0) {
                // Stay in deposit stage
                $group->update(['status' => GroupStatus::DepositStage]);
                $cycle->update(['status' => CycleStatus::DepositStage]);
            } else {
                // Skip deposit stage, go directly to active
                $group->update(['status' => GroupStatus::Active]);
                $cycle->update(['status' => CycleStatus::Ready]);
            }
        });
    }

    /**
     * Calculate the current status of all entities for dashboard display.
     */
    public function getGroupStatusOverview(EqubGroup $group): array
    {
        $cycle = $group->activeCycle;

        return [
            'group_status' => $group->status->value,
            'group_status_label' => $group->status->label(),
            'cycle_status' => $cycle?->status->value,
            'cycle_status_label' => $cycle?->status->label(),
            'deposit_rounds' => [
                'total' => $group->depositRounds()->count(),
                'pending' => $group->depositRounds()->where('status', DepositRoundStatus::Pending->value)->count(),
                'open' => $group->depositRounds()->where('status', DepositRoundStatus::Open->value)->count(),
                'closed' => $group->depositRounds()->where('status', DepositRoundStatus::Closed->value)->count(),
            ],
            'deposit_obligations' => $this->getDepositObligationStats($group),
            'contribution_periods' => $this->getContributionPeriodStats($group),
            'payouts' => $this->getPayoutStats($group),
            'can_advance_to_next_stage' => $this->canAdvanceToNextStage($group),
        ];
    }

    protected function getDepositObligationStats(EqubGroup $group): array
    {
        $obligations = DepositObligation::whereIn('deposit_round_id',
            $group->depositRounds()->pluck('id')
        )->get();

        return [
            'total' => $obligations->count(),
            'pending' => $obligations->where('status', DepositObligationStatus::Pending->value)->count(),
            'submitted' => $obligations->where('status', DepositObligationStatus::Submitted->value)->count(),
            'verified' => $obligations->where('status', DepositObligationStatus::Verified->value)->count(),
            'overdue' => $obligations->where('status', DepositObligationStatus::Overdue->value)->count(),
            'exempt' => $obligations->where('status', DepositObligationStatus::Exempt->value)->count(),
        ];
    }

    protected function getContributionPeriodStats(EqubGroup $group): array
    {
        $periods = $group->contributionPeriods;

        return [
            'total' => $periods->count(),
            'pending' => $periods->where('status', 'pending')->count(),
            'open' => $periods->where('status', 'open')->count(),
            'closed' => $periods->where('status', 'closed')->count(),
        ];
    }

    protected function getPayoutStats(EqubGroup $group): array
    {
        $payouts = $group->payouts;

        return [
            'total' => $payouts->count(),
            'scheduled' => $payouts->where('status', PayoutStatus::Scheduled->value)->count(),
            'pending_approval' => $payouts->where('status', PayoutStatus::PendingApproval->value)->count(),
            'approved' => $payouts->where('status', PayoutStatus::Approved->value)->count(),
            'disbursed' => $payouts->where('status', PayoutStatus::Disbursed->value)->count(),
            'completed' => $payouts->where('status', PayoutStatus::Completed->value)->count(),
        ];
    }

    protected function canAdvanceToNextStage(EqubGroup $group): array
    {
        $currentStatus = $group->status;
        $blockers = [];
        $nextStage = null;

        switch ($currentStatus) {
            case GroupStatus::Draft:
                $nextStage = GroupStatus::Registration;
                if (! $group->activeRule) {
                    $blockers[] = 'Group must have active rules configured.';
                }
                break;

            case GroupStatus::Registration:
                $nextStage = GroupStatus::DepositStage;
                if ($group->activeMemberships()->count() < 2) {
                    $blockers[] = 'Group must have at least 2 active members enrolled.';
                }
                break;

            case GroupStatus::DepositStage:
                $nextStage = GroupStatus::Active;
                $cycle = $group->activeCycle;
                if (! $cycle || ! in_array($cycle->status, [CycleStatus::Ready, CycleStatus::Active], true)) {
                    $blockers[] = 'All deposit rounds must be closed and verified.';
                }
                break;

            case GroupStatus::Active:
                // Check if all payouts are completed
                $incompletePayouts = $group->payouts()
                    ->whereNotIn('status', [PayoutStatus::Completed->value, PayoutStatus::Cancelled->value])
                    ->count();
                if ($incompletePayouts === 0 && $group->payouts()->count() > 0) {
                    $nextStage = GroupStatus::Completed;
                }
                break;

            case GroupStatus::Completed:
            case GroupStatus::Cancelled:
                // Terminal states
                break;
        }

        return [
            'can_advance' => empty($blockers),
            'current_stage' => $currentStatus->value,
            'current_stage_label' => $currentStatus->label(),
            'next_stage' => $nextStage?->value,
            'next_stage_label' => $nextStage?->label(),
            'blockers' => $blockers,
        ];
    }
}
