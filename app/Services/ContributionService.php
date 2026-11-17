<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ContributionFrequency;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\ReceiptType;
use App\Models\ContributionObligation;
use App\Models\ContributionPeriod;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\EqubMembership;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\PaymentVerification;
use App\Models\Receipt;
use App\Models\User;
use App\Support\OverdueExpression;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ContributionService
{
    public function __construct(
        protected AuditService $auditService,
        protected FinancialLedgerService $ledgerService,
        protected StatusWorkflowService $statusWorkflow
    ) {}

    public function generateContributionPeriods(EqubGroup $group, EqubCycle $cycle, User $actor): Collection
    {
        return DB::transaction(function () use ($group, $cycle) {
            $rule = $group->activeRule;
            $periodsCount = $rule?->expected_members ?? $group->activeMemberships()->count();
            if ($periodsCount <= 0) {
                $periodsCount = 10;
            }

            $amountDue = $rule?->contribution_amount ?? 1000.00;
            $graceDays = $rule?->late_penalty_grace_days ?? 2;
            $frequency = $rule?->contribution_frequency ?? ContributionFrequency::Monthly;

            $startDate = $cycle->activated_on ? Carbon::parse($cycle->activated_on) : now();

            $createdPeriods = new Collection;

            for ($seq = 1; $seq <= $periodsCount; $seq++) {
                $intervalDays = match ($frequency) {
                    ContributionFrequency::Daily => $seq,
                    ContributionFrequency::Weekly => $seq * 7,
                    ContributionFrequency::Biweekly => $seq * 14,
                    ContributionFrequency::Monthly => $seq * 30,
                    default => $seq * 30,
                };

                $opensOn = $startDate->copy()->addDays($intervalDays - 7)->toDateString();
                $dueOn = $startDate->copy()->addDays($intervalDays)->toDateString();
                $closesOn = $startDate->copy()->addDays($intervalDays + 3)->toDateString();

                $period = ContributionPeriod::firstOrCreate(
                    [
                        'equb_group_id' => $group->id,
                        'sequence' => $seq,
                    ],
                    [
                        'equb_cycle_id' => $cycle->id,
                        'label' => "Contribution Round {$seq}",
                        'opens_on' => $opensOn,
                        'due_on' => $dueOn,
                        'closes_on' => $closesOn,
                        'status' => $seq === 1 ? 'open' : 'pending',
                        'amount_due_snapshot' => $amountDue,
                        'grace_days_snapshot' => $graceDays,
                        'generated_at' => now(),
                    ]
                );

                $createdPeriods->push($period);
            }

            $this->auditService->log(
                event: 'contribution_periods.generated',
                auditable: $cycle,
                before: [],
                after: ['count' => $createdPeriods->count()],
                equbGroupId: $group->id
            );

            return $createdPeriods;
        });
    }

    public function generateMemberObligations(ContributionPeriod $period, User $actor): Collection
    {
        return DB::transaction(function () use ($period) {
            $memberships = $period->group->activeMemberships()->with('memberProfile')->get();
            $obligations = new Collection;

            foreach ($memberships as $membership) {
                $obligation = ContributionObligation::firstOrCreate(
                    [
                        'contribution_period_id' => $period->id,
                        'equb_membership_id' => $membership->id,
                    ],
                    [
                        'member_profile_id' => $membership->member_profile_id,
                        'amount_due' => $period->amount_due_snapshot,
                        'amount_paid' => 0.00,
                        'due_on' => $period->due_on,
                        'grace_days' => $period->grace_days_snapshot,
                        'status' => 'pending',
                        'is_late' => false,
                        'late_penalty_amount' => 0.00,
                        'generated_at' => now(),
                    ]
                );

                $obligations->push($obligation);
            }

            $this->auditService->log(
                event: 'contribution_obligations.generated',
                auditable: $period,
                before: [],
                after: ['period_id' => $period->id, 'count' => $obligations->count()],
                equbGroupId: $period->equb_group_id
            );

            return $obligations;
        });
    }

    public function recordContributionPayment(ContributionObligation $obligation, array $data, User $submitter): Payment
    {
        return DB::transaction(function () use ($obligation, $data, $submitter) {
            if ($obligation->status === 'verified') {
                throw ValidationException::withMessages([
                    'obligation' => ['This contribution obligation has already been fully verified.'],
                ]);
            }

            $period = $obligation->period;
            $amount = (string) ($data['amount'] ?? $obligation->amount_due);

            $payment = Payment::create([
                'equb_group_id' => $period->equb_group_id,
                'equb_cycle_id' => $period->equb_cycle_id,
                'equb_membership_id' => $obligation->equb_membership_id,
                'member_profile_id' => $obligation->member_profile_id,
                'submitted_by_user_id' => $submitter->id,
                'payment_type' => PaymentType::Contribution,
                'amount' => $amount,
                'currency' => 'ETB',
                'method' => $data['method'] ?? PaymentMethod::BankTransfer,
                'reference' => $data['reference'] ?? null,
                'paid_on' => $data['paid_on'] ?? now()->toDateString(),
                'status' => PaymentStatus::Submitted,
                'idempotency_key' => 'cnt-'.$obligation->id.'-'.Str::uuid(),
                'evidence_file_path' => $data['evidence_file_path'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            PaymentAllocation::create([
                'payment_id' => $payment->id,
                'contribution_obligation_id' => $obligation->id,
                'amount' => $amount,
            ]);

            $obligation->update([
                'status' => 'submitted',
                'amount_paid' => $amount,
            ]);

            $this->auditService->log(
                event: 'contribution_payment.submitted',
                auditable: $payment,
                before: [],
                after: ['amount' => $amount, 'obligation_id' => $obligation->id],
                equbGroupId: $period->equb_group_id
            );

            return $payment;
        });
    }

    public function verifyContributionPayment(Payment $payment, User $verifier, string $decision, ?string $reason = null): Payment
    {
        return DB::transaction(function () use ($payment, $verifier, $decision, $reason) {
            // Maker-Checker - Skip for super-admins (they can verify their own payments)
            if ($payment->submitted_by_user_id === $verifier->id && ! $verifier->isSuperAdmin()) {
                throw ValidationException::withMessages([
                    'verifier' => ['Maker-checker violation: the user who submitted payment evidence cannot verify it.'],
                ]);
            }

            if ($payment->status === PaymentStatus::Verified) {
                throw ValidationException::withMessages([
                    'payment' => ['This payment is already verified.'],
                ]);
            }

            if ($decision === 'verified') {
                $payment->update([
                    'status' => PaymentStatus::Verified,
                    'verified_at' => now(),
                    'verified_by' => $verifier->id,
                ]);

                PaymentVerification::create([
                    'payment_id' => $payment->id,
                    'decision' => 'verified',
                    'amount_verified' => $payment->amount,
                    'verifier_user_id' => $verifier->id,
                    'decided_at' => now(),
                    'reason' => $reason,
                ]);

                // Update allocated contribution obligations
                $allocations = PaymentAllocation::where('payment_id', $payment->id)->get();
                foreach ($allocations as $alloc) {
                    if ($alloc->contribution_obligation_id) {
                        $obligation = ContributionObligation::find($alloc->contribution_obligation_id);
                        if ($obligation) {
                            $obligation->update([
                                'status' => 'verified',
                                'amount_paid' => $obligation->amount_due,
                            ]);
                        }
                    }
                }

                // Issue receipt
                $year = date('Y');
                $count = Receipt::whereYear('created_at', $year)->count() + 1;
                Receipt::create([
                    'receipt_number' => sprintf('REC-%s-%06d', $year, $count),
                    'receipt_type' => ReceiptType::Payment,
                    'receiptable_type' => Payment::class,
                    'receiptable_id' => $payment->id,
                    'equb_group_id' => $payment->equb_group_id,
                    'member_profile_id' => $payment->member_profile_id,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'issued_at' => now(),
                    'issued_by_user_id' => $verifier->id,
                    'notes' => "Receipt for Regular Contribution - Ref: {$payment->reference}",
                ]);

                // Post double-entry journal entry to financial ledger
                $this->ledgerService->postContribution($payment, $verifier);

                $this->auditService->log(
                    event: 'contribution_payment.verified',
                    auditable: $payment,
                    before: ['status' => PaymentStatus::Submitted->value],
                    after: ['status' => PaymentStatus::Verified->value],
                    equbGroupId: $payment->equb_group_id
                );

                // Trigger cascading status updates
                $this->statusWorkflow->onPaymentVerified($payment, $verifier->id);
            } else {
                $payment->update(['status' => PaymentStatus::Rejected]);

                PaymentVerification::create([
                    'payment_id' => $payment->id,
                    'decision' => 'rejected',
                    'amount_verified' => 0.00,
                    'verifier_user_id' => $verifier->id,
                    'decided_at' => now(),
                    'reason' => $reason ?? 'Payment rejected by verifier.',
                ]);

                $allocations = PaymentAllocation::where('payment_id', $payment->id)->get();
                foreach ($allocations as $alloc) {
                    if ($alloc->contribution_obligation_id) {
                        $obligation = ContributionObligation::find($alloc->contribution_obligation_id);
                        if ($obligation) {
                            $obligation->update([
                                'status' => 'pending',
                                'amount_paid' => 0.00,
                            ]);
                        }
                    }
                }

                $this->auditService->log(
                    event: 'contribution_payment.rejected',
                    auditable: $payment,
                    before: ['status' => PaymentStatus::Submitted->value],
                    after: ['status' => PaymentStatus::Rejected->value, 'reason' => $reason],
                    equbGroupId: $payment->equb_group_id
                );
            }

            return $payment->fresh();
        });
    }

    /**
     * Automatic Member Status Classification — confirmed business rules:
     *
     * Priority order (evaluated top-to-bottom):
     *   BLUE  — member has a Disbursed or Completed payout in the current cycle.
     *           BLUE has priority over GREEN and RED.
     *           BLUE + overdue is possible (shown with a secondary OVERDUE warning).
     *   GREEN — current open contribution period obligation is FULLY VERIFIED,
     *           and member has NOT yet received a payout.
     *   RED   — current obligation is unpaid or not fully verified (includes pending/partial),
     *           and member has NOT yet received a payout.
     *   N/A   — deposit stage, no open period, suspended/withdrawn, no obligation generated.
     *
     * Statuses are DERIVED from financial records. Never manually set.
     * Overdue is a separate secondary flag: balance > 0 AND today > due_on + grace_days.
     * A BLUE member can be overdue on a different obligation.
     */
    public function classifyMemberStatus(EqubMembership $membership, ?EqubCycle $cycle = null): array
    {
        // Load the cycle from the group's active cycle if not provided
        $activeCycle = $cycle ?? $membership->group?->activeCycle;

        // ── BLUE check (highest priority) ───────────────────────────────────
        // Business rule: PAID only after actual disbursement (disbursed OR completed).
        // 'approved' alone does NOT produce BLUE.
        $hasReceivedPayout = $membership->hasReceivedPayout($activeCycle?->id);

        // ── Overdue check (secondary flag, independent of primary color) ────
        // Checks ANY unverified obligation that is past its grace window in this cycle.
        $hasOverdue = $this->memberHasAnyOverdueObligation($membership, $activeCycle);

        if ($hasReceivedPayout) {
            return [
                'color' => 'blue',
                'is_overdue' => $hasOverdue,
                'label' => $hasOverdue
                    ? 'Payout Received — Overdue Obligation Warning'
                    : 'Payout Received',
                'badge' => $hasOverdue ? 'BLUE + OVERDUE' : 'BLUE',
            ];
        }

        // If no active cycle or still in deposit stage — not applicable
        if (! $activeCycle || $activeCycle->status->value === 'deposit_stage') {
            return [
                'color' => 'neutral',
                'is_overdue' => false,
                'label' => 'Deposit Stage — Not Yet Active',
                'badge' => 'N/A',
            ];
        }

        // ── Current period obligation check ──────────────────────────────────
        // "Current" = the latest OPEN contribution period for this cycle.
        $currentPeriod = ContributionPeriod::where('equb_cycle_id', $activeCycle->id)
            ->where('status', 'open')
            ->orderByDesc('sequence')
            ->first();

        if (! $currentPeriod) {
            return [
                'color' => 'neutral',
                'is_overdue' => $hasOverdue,
                'label' => $hasOverdue ? 'No Active Period — Overdue Warning' : 'No Active Contribution Period',
                'badge' => $hasOverdue ? 'OVERDUE' : 'N/A',
            ];
        }

        $obligation = ContributionObligation::where('contribution_period_id', $currentPeriod->id)
            ->where('equb_membership_id', $membership->id)
            ->first();

        // No obligation generated yet → RED (treat as unpaid)
        if (! $obligation) {
            return [
                'color' => 'red',
                'is_overdue' => $hasOverdue,
                'label' => 'Obligation Not Yet Generated',
                'badge' => 'RED',
            ];
        }

        // ── GREEN: current obligation fully verified ──────────────────────────
        if ($obligation->status === 'verified') {
            return [
                'color' => 'green',
                'is_overdue' => $hasOverdue,
                'label' => $hasOverdue
                    ? 'Contribution Verified — Overdue on Other Period'
                    : 'Contribution Verified — Eligible for Payout',
                'badge' => $hasOverdue ? 'GREEN + OVERDUE' : 'GREEN',
            ];
        }

        // ── RED: unpaid, partial, pending, or overdue current obligation ──────
        return [
            'color' => 'red',
            'is_overdue' => $hasOverdue || $obligation->isOverdue(),
            'label' => $obligation->isOverdue()
                ? 'Overdue — Contribution Not Verified'
                : 'Contribution Unpaid / Pending Verification',
            'badge' => ($hasOverdue || $obligation->isOverdue()) ? 'RED + OVERDUE' : 'RED',
        ];
    }

    /**
     * Check whether the member has any overdue obligation in the given cycle.
     * Overdue = balance > 0 AND today > due_on + grace_days (not restricted to current period).
     */
    private function memberHasAnyOverdueObligation(EqubMembership $membership, ?EqubCycle $cycle): bool
    {
        return ContributionObligation::where('equb_membership_id', $membership->id)
            ->when($cycle, fn ($q) => $q->whereHas('period', fn ($q2) => $q2->where('equb_cycle_id', $cycle->id)))
            ->whereNotIn('status', ['verified', 'exempt'])
            ->whereRaw(OverdueExpression::dueDatePlusGraceDaysHasPassed())
            ->exists();
    }

    public function getGroupStatusBoard(EqubGroup $group): array
    {
        $activeCycle = $group->activeCycle;
        $memberships = $group->activeMemberships()->with('memberProfile')->get();

        $greenCount = 0;
        $redCount = 0;
        $blueCount = 0;
        $neutralCount = 0;
        $overdueCount = 0;
        $membersData = [];

        foreach ($memberships as $m) {
            $classification = $this->classifyMemberStatus($m, $activeCycle);

            match ($classification['color']) {
                'green' => $greenCount++,
                'red' => $redCount++,
                'blue' => $blueCount++,
                default => $neutralCount++,
            };

            if ($classification['is_overdue']) {
                $overdueCount++;
            }

            $membersData[] = [
                'membership_id' => $m->id,
                'member_profile_id' => $m->member_profile_id,
                'full_name' => $m->memberProfile?->full_name ?? "Member #{$m->membership_number}",
                'membership_number' => $m->membership_number,
                'role' => $m->role->value,
                'color' => $classification['color'],
                'is_overdue' => $classification['is_overdue'],
                'label' => $classification['label'],
                'badge' => $classification['badge'],
            ];
        }

        return [
            'green' => $greenCount,
            'red' => $redCount,
            'blue' => $blueCount,
            'neutral' => $neutralCount,
            'overdue' => $overdueCount,
            'total_active' => $memberships->count(),
            'members' => $membersData,
        ];
    }
}
