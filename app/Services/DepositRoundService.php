<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CycleStatus;
use App\Enums\DepositObligationStatus;
use App\Enums\DepositRoundStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\ReceiptType;
use App\Models\DepositObligation;
use App\Models\DepositRound;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\PaymentVerification;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DepositRoundService
{
    public function __construct(
        protected AuditService $auditService,
        protected FinancialLedgerService $ledgerService,
        protected StatusWorkflowService $statusWorkflow
    ) {}

    public function createCycleForGroup(EqubGroup $group, User $actor): EqubCycle
    {
        return DB::transaction(function () use ($group, $actor) {
            $nextCycleNumber = ($group->cycles()->max('cycle_number') ?? 0) + 1;
            $activeRule = $group->activeRule;

            $status = ($activeRule && $activeRule->initial_deposit_rounds > 0)
                ? CycleStatus::DepositStage
                : CycleStatus::Ready;

            $cycle = EqubCycle::create([
                'equb_group_id' => $group->id,
                'cycle_number' => $nextCycleNumber,
                'status' => $status,
                'rule_version_id' => $activeRule?->id,
                'rule_snapshot' => $activeRule?->toArray(),
                'started_on' => now()->toDateString(),
                'created_by' => $actor->id,
            ]);

            $this->auditService->log(
                event: 'equb_cycle.created',
                auditable: $cycle,
                before: [],
                after: ['cycle_number' => $cycle->cycle_number, 'status' => $cycle->status->value],
                equbGroupId: $group->id
            );

            // Automatically pre-configure configured number of initial deposit rounds
            if ($activeRule && $activeRule->initial_deposit_rounds > 0) {
                for ($seq = 1; $seq <= $activeRule->initial_deposit_rounds; $seq++) {
                    $opensOn = now()->addDays(($seq - 1) * 7)->toDateString();
                    $dueOn = now()->addDays(($seq * 7) - 2)->toDateString();
                    $closesOn = now()->addDays($seq * 7)->toDateString();

                    $this->createDepositRound($cycle, $seq, [
                        'label' => "Initial Deposit Round {$seq}",
                        'amount_per_member' => $activeRule->initial_deposit_amount,
                        'opens_on' => $opensOn,
                        'due_on' => $dueOn,
                        'closes_on' => $closesOn,
                        'requires_previous_close' => true,
                    ], $actor);
                }
            }

            return $cycle;
        });
    }

    public function createDepositRound(EqubCycle $cycle, int $sequence, array $data, User $actor): DepositRound
    {
        return DB::transaction(function () use ($cycle, $sequence, $data, $actor) {
            $round = DepositRound::create([
                'equb_group_id' => $cycle->equb_group_id,
                'equb_cycle_id' => $cycle->id,
                'sequence' => $sequence,
                'label' => $data['label'] ?? "Initial Deposit Round {$sequence}",
                'amount_per_member' => $data['amount_per_member'],
                'opens_on' => $data['opens_on'],
                'due_on' => $data['due_on'],
                'closes_on' => $data['closes_on'],
                'status' => DepositRoundStatus::Pending,
                'requires_previous_close' => $data['requires_previous_close'] ?? true,
                'created_by' => $actor->id,
            ]);

            $this->auditService->log(
                event: 'deposit_round.created',
                auditable: $round,
                before: [],
                after: ['sequence' => $round->sequence, 'amount_per_member' => $round->amount_per_member],
                equbGroupId: $cycle->equb_group_id
            );

            return $round;
        });
    }

    public function openRound(DepositRound $round, User $actor): DepositRound
    {
        return DB::transaction(function () use ($round, $actor) {
            // Check if previous round must be closed
            if ($round->requires_previous_close && $round->sequence > 1) {
                $previousRound = DepositRound::where('equb_group_id', $round->equb_group_id)
                    ->where('sequence', $round->sequence - 1)
                    ->first();

                if ($previousRound && $previousRound->status !== DepositRoundStatus::Closed) {
                    throw ValidationException::withMessages([
                        'round' => ["Previous round {$previousRound->label} must be closed before opening this round."],
                    ]);
                }
            }

            $round->update([
                'status' => DepositRoundStatus::Open,
                'approved_by' => $actor->id,
                'approved_at' => now(),
            ]);

            // Generate obligations for all active memberships.
            // Confirmed rule: every active member must satisfy deposit obligations;
            // there is no organizer exemption policy.
            $memberships = $round->group->activeMemberships()->with('memberProfile')->get();

            foreach ($memberships as $membership) {
                DepositObligation::firstOrCreate(
                    [
                        'deposit_round_id' => $round->id,
                        'equb_membership_id' => $membership->id,
                    ],
                    [
                        'member_profile_id' => $membership->member_profile_id,
                        'amount_due' => $round->amount_per_member,
                        'amount_paid' => 0.00,
                        'due_on' => $round->due_on,
                        'grace_days' => 2,
                        'status' => DepositObligationStatus::Pending,
                        'is_exempt' => false,
                        'exemption_reason' => null,
                        'generated_at' => now(),
                    ]
                );
            }

            $this->auditService->log(
                event: 'deposit_round.opened',
                auditable: $round,
                before: ['status' => DepositRoundStatus::Pending->value],
                after: ['status' => DepositRoundStatus::Open->value],
                equbGroupId: $round->equb_group_id
            );

            return $round;
        });
    }

    public function recordDepositPayment(DepositObligation $obligation, array $data, User $submitter): Payment
    {
        return DB::transaction(function () use ($obligation, $data, $submitter) {
            if ($obligation->is_exempt) {
                throw ValidationException::withMessages([
                    'obligation' => ['This obligation is exempt and no payment is due.'],
                ]);
            }

            if ($obligation->status === DepositObligationStatus::Verified) {
                throw ValidationException::withMessages([
                    'obligation' => ['This obligation has already been fully verified and paid.'],
                ]);
            }

            $round = $obligation->round;
            $amount = (string) ($data['amount'] ?? $obligation->amount_due);

            $payment = Payment::create([
                'equb_group_id' => $round->equb_group_id,
                'equb_cycle_id' => $round->equb_cycle_id,
                'equb_membership_id' => $obligation->equb_membership_id,
                'member_profile_id' => $obligation->member_profile_id,
                'submitted_by_user_id' => $submitter->id,
                'payment_type' => PaymentType::Deposit,
                'amount' => $amount,
                'currency' => 'ETB',
                'method' => $data['method'] ?? PaymentMethod::BankTransfer,
                'reference' => $data['reference'] ?? null,
                'paid_on' => $data['paid_on'] ?? now()->toDateString(),
                'status' => PaymentStatus::Submitted,
                'idempotency_key' => 'dep-'.$obligation->id.'-'.Str::uuid(),
                'evidence_file_path' => $data['evidence_file_path'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            PaymentAllocation::create([
                'payment_id' => $payment->id,
                'deposit_obligation_id' => $obligation->id,
                'amount' => $amount,
            ]);

            $obligation->update([
                'status' => DepositObligationStatus::Submitted,
                'amount_paid' => $amount,
            ]);

            $this->auditService->log(
                event: 'payment.submitted',
                auditable: $payment,
                before: [],
                after: ['amount' => $amount, 'obligation_id' => $obligation->id],
                equbGroupId: $round->equb_group_id
            );

            return $payment;
        });
    }

    public function verifyDepositPayment(Payment $payment, User $verifier, string $decision, ?string $reason = null): Payment
    {
        return DB::transaction(function () use ($payment, $verifier, $decision, $reason) {
            // Maker-Checker Invariant - Skip for super-admins (they can verify their own payments)
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

                // Update allocated obligations
                foreach ($payment->allocations as $allocation) {
                    if ($allocation->depositObligation) {
                        $obligation = $allocation->depositObligation;
                        $obligation->update([
                            'status' => DepositObligationStatus::Verified,
                            'amount_paid' => $obligation->amount_due,
                        ]);
                    }
                }

                // Issue official payment receipt
                $this->issueReceipt($payment, $verifier);

                // Post double-entry journal entry to financial ledger
                $this->ledgerService->postInitialDeposit($payment, $verifier);

                $this->auditService->log(
                    event: 'payment.verified',
                    auditable: $payment,
                    before: ['status' => PaymentStatus::Submitted->value],
                    after: ['status' => PaymentStatus::Verified->value, 'verified_by' => $verifier->id],
                    equbGroupId: $payment->equb_group_id
                );

                // Trigger cascading status updates
                $this->statusWorkflow->onPaymentVerified($payment, $verifier->id);
            } else {
                $payment->update([
                    'status' => PaymentStatus::Rejected,
                ]);

                PaymentVerification::create([
                    'payment_id' => $payment->id,
                    'decision' => 'rejected',
                    'amount_verified' => 0.00,
                    'verifier_user_id' => $verifier->id,
                    'decided_at' => now(),
                    'reason' => $reason ?? 'Payment rejected by verifier.',
                ]);

                // Revert allocated obligations
                foreach ($payment->allocations as $allocation) {
                    if ($allocation->depositObligation) {
                        $obligation = $allocation->depositObligation;
                        $obligation->update([
                            'status' => DepositObligationStatus::Pending,
                            'amount_paid' => 0.00,
                        ]);
                    }
                }

                $this->auditService->log(
                    event: 'payment.rejected',
                    auditable: $payment,
                    before: ['status' => PaymentStatus::Submitted->value],
                    after: ['status' => PaymentStatus::Rejected->value, 'reason' => $reason],
                    equbGroupId: $payment->equb_group_id
                );
            }

            return $payment->fresh();
        });
    }

    public function issueReceipt(Payment $payment, User $actor): Receipt
    {
        $year = date('Y');
        $count = Receipt::whereYear('created_at', $year)->count() + 1;
        $receiptNumber = sprintf('REC-%s-%06d', $year, $count);

        return Receipt::create([
            'receipt_number' => $receiptNumber,
            'receipt_type' => ReceiptType::Payment,
            'receiptable_type' => Payment::class,
            'receiptable_id' => $payment->id,
            'equb_group_id' => $payment->equb_group_id,
            'member_profile_id' => $payment->member_profile_id,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'issued_at' => now(),
            'issued_by_user_id' => $actor->id,
            'notes' => "Receipt for {$payment->payment_type->label()} - Ref: {$payment->reference}",
        ]);
    }

    public function closeRound(DepositRound $round, User $actor): DepositRound
    {
        return DB::transaction(function () use ($round) {
            // Check that all non-exempt obligations are verified
            $unverifiedCount = $round->obligations()
                ->where('is_exempt', false)
                ->where('status', '!=', DepositObligationStatus::Verified->value)
                ->count();

            if ($unverifiedCount > 0) {
                throw ValidationException::withMessages([
                    'round' => ["Cannot close round: {$unverifiedCount} member obligation(s) are still pending verification."],
                ]);
            }

            $round->update([
                'status' => DepositRoundStatus::Closed,
            ]);

            $this->auditService->log(
                event: 'deposit_round.closed',
                auditable: $round,
                before: ['status' => DepositRoundStatus::Open->value],
                after: ['status' => DepositRoundStatus::Closed->value],
                equbGroupId: $round->equb_group_id
            );

            // Trigger cascading status updates
            $this->statusWorkflow->onDepositRoundClosed($round);

            return $round;

            return $round;
        });
    }

    public function checkDepositStageComplete(EqubGroup $group, User $actor): void
    {
        $cycle = $group->activeCycle;
        if (! $cycle) {
            return;
        }

        $activeRule = $group->activeRule;
        $configuredRounds = $activeRule?->initial_deposit_rounds ?? 0;

        if ($configuredRounds === 0) {
            $cycle->update(['status' => CycleStatus::Ready]);

            return;
        }

        $closedRoundsCount = DepositRound::where('equb_group_id', $group->id)
            ->where('status', DepositRoundStatus::Closed->value)
            ->count();

        if ($closedRoundsCount >= $configuredRounds) {
            $cycle->update([
                'status' => CycleStatus::Ready,
                'deposit_stage_closed_on' => now()->toDateString(),
            ]);

            $this->auditService->log(
                event: 'deposit_stage.completed',
                auditable: $cycle,
                before: ['status' => CycleStatus::DepositStage->value],
                after: ['status' => CycleStatus::Ready->value],
                equbGroupId: $group->id
            );
        }
    }

    public function calculateAccumulatedDeposits(EqubGroup $group): array
    {
        $rounds = $group->depositRounds()->with('obligations')->get();

        $totalExpected = 0.00;
        $totalVerified = 0.00;
        $totalPending = 0.00;

        foreach ($rounds as $round) {
            foreach ($round->obligations as $obligation) {
                if (! $obligation->is_exempt) {
                    $totalExpected += (float) $obligation->amount_due;
                    if ($obligation->status === DepositObligationStatus::Verified) {
                        $totalVerified += (float) $obligation->amount_paid;
                    } else {
                        $totalPending += (float) $obligation->amount_due;
                    }
                }
            }
        }

        return [
            'total_expected' => number_format($totalExpected, 2, '.', ''),
            'total_verified' => number_format($totalVerified, 2, '.', ''),
            'total_pending' => number_format($totalPending, 2, '.', ''),
            // Confirmed rule: verified initial deposits are accumulated and retained.
            // Their eventual distribution/refund policy is still a pending decision.
            'retained_deposits' => number_format($totalVerified, 2, '.', ''),
            'rounds_count' => $rounds->count(),
        ];
    }
}
