<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\EqubGroup;
use App\Models\Payment;
use App\Models\Penalty;
use App\Models\PenaltyWaiverRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PenaltyService
{
    public function __construct(
        protected AuditService $auditService,
        protected FinancialLedgerService $ledgerService
    ) {}

    public function assessLatePenalties(EqubGroup $group, User $actor): Collection
    {
        $rule = $group->activeRule;
        if (! $rule || ! $rule->late_penalty_enabled) {
            return new Collection;
        }

        return DB::transaction(function () use ($group, $rule, $actor) {
            $periods = $group->contributionPeriods()->whereIn('status', ['open', 'closed'])->get();
            $assessed = new Collection;

            foreach ($periods as $period) {
                $overdueObligations = $period->obligations()
                    ->where('status', '!=', 'verified')
                    ->get();

                foreach ($overdueObligations as $obligation) {
                    if ($obligation->isOverdue()) {
                        $fixedPenalty = (float) $rule->late_penalty_fixed_amount;
                        $dailyRate = (float) $rule->late_penalty_daily_rate;

                        $graceDeadline = $obligation->due_on->copy()->addDays($obligation->grace_days);
                        $daysOverdue = max(1, now()->diffInDays($graceDeadline));
                        $totalPenalty = $fixedPenalty + ($dailyRate * $daysOverdue);

                        $penalty = Penalty::firstOrCreate(
                            [
                                'equb_group_id' => $group->id,
                                'contribution_obligation_id' => $obligation->id,
                            ],
                            [
                                'equb_membership_id' => $obligation->equb_membership_id,
                                'member_profile_id' => $obligation->member_profile_id,
                                'reason' => "Late payment penalty for {$period->label} ({$daysOverdue} day(s) overdue)",
                                'amount' => (string) $totalPenalty,
                                'currency' => 'ETB',
                                'status' => 'pending',
                                'assessed_at' => now(),
                                'assessed_by' => $actor->id,
                            ]
                        );

                        $obligation->update([
                            'is_late' => true,
                            'late_penalty_amount' => (string) $totalPenalty,
                        ]);

                        $assessed->push($penalty);
                    }
                }
            }

            if ($assessed->isNotEmpty()) {
                $this->auditService->log(
                    event: 'penalties.assessed',
                    auditable: $group,
                    before: [],
                    after: ['count' => $assessed->count()],
                    equbGroupId: $group->id
                );
            }

            return $assessed;
        });
    }

    public function requestWaiver(Penalty $penalty, string $reason, User $requester): PenaltyWaiverRequest
    {
        return DB::transaction(function () use ($penalty, $reason, $requester) {
            if ($penalty->status !== 'pending') {
                throw ValidationException::withMessages([
                    'penalty' => ["Penalty is already {$penalty->status} and cannot be waived."],
                ]);
            }

            $waiver = PenaltyWaiverRequest::create([
                'penalty_id' => $penalty->id,
                'requested_by' => $requester->id,
                'reason' => $reason,
                'status' => 'pending',
            ]);

            $this->auditService->log(
                event: 'penalty_waiver.requested',
                auditable: $waiver,
                before: [],
                after: ['penalty_id' => $penalty->id, 'reason' => $reason],
                equbGroupId: $penalty->equb_group_id
            );

            return $waiver;
        });
    }

    public function reviewWaiver(PenaltyWaiverRequest $request, string $decision, ?string $reason, User $reviewer): PenaltyWaiverRequest
    {
        return DB::transaction(function () use ($request, $decision, $reason, $reviewer) {
            // Maker-Checker Check
            if ($request->requested_by === $reviewer->id) {
                throw ValidationException::withMessages([
                    'reviewer' => ['Maker-checker violation: the user who requested a waiver cannot approve it.'],
                ]);
            }

            if ($request->status !== 'pending') {
                throw ValidationException::withMessages([
                    'waiver' => ['This waiver request has already been reviewed.'],
                ]);
            }

            $penalty = $request->penalty;

            if ($decision === 'approved') {
                $request->update([
                    'status' => 'approved',
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                    'decision_reason' => $reason,
                ]);

                $penalty->update([
                    'status' => 'waived',
                    'waived_at' => now(),
                    'waived_by' => $reviewer->id,
                    'waiver_reason' => $reason ?? $request->reason,
                ]);

                // Reset penalty amount on obligation if linked
                if ($penalty->obligation) {
                    $penalty->obligation->update([
                        'late_penalty_amount' => 0.00,
                    ]);
                }

                $this->auditService->log(
                    event: 'penalty_waiver.approved',
                    auditable: $request,
                    before: ['status' => 'pending'],
                    after: ['status' => 'approved', 'reviewed_by' => $reviewer->id],
                    equbGroupId: $penalty->equb_group_id
                );
            } else {
                $request->update([
                    'status' => 'rejected',
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                    'decision_reason' => $reason,
                ]);

                $this->auditService->log(
                    event: 'penalty_waiver.rejected',
                    auditable: $request,
                    before: ['status' => 'pending'],
                    after: ['status' => 'rejected', 'reviewed_by' => $reviewer->id],
                    equbGroupId: $penalty->equb_group_id
                );
            }

            return $request->fresh();
        });
    }

    public function settlePenalty(Penalty $penalty, array $paymentData, User $submitter): Payment
    {
        return DB::transaction(function () use ($penalty, $paymentData, $submitter) {
            if ($penalty->status !== 'pending') {
                throw ValidationException::withMessages([
                    'penalty' => ["Penalty is already {$penalty->status}."],
                ]);
            }

            $payment = Payment::create([
                'equb_group_id' => $penalty->equb_group_id,
                'equb_membership_id' => $penalty->equb_membership_id,
                'member_profile_id' => $penalty->member_profile_id,
                'submitted_by_user_id' => $submitter->id,
                'payment_type' => PaymentType::Penalty,
                'amount' => $penalty->amount,
                'currency' => 'ETB',
                'method' => $paymentData['method'] ?? PaymentMethod::BankTransfer,
                'reference' => $paymentData['reference'] ?? null,
                'paid_on' => $paymentData['paid_on'] ?? now()->toDateString(),
                'status' => PaymentStatus::Verified,
                'idempotency_key' => 'pen-'.$penalty->id.'-'.Str::uuid(),
                'notes' => $paymentData['notes'] ?? "Penalty payment for: {$penalty->reason}",
                'verified_at' => now(),
                'verified_by' => $submitter->id,
            ]);

            $penalty->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $this->auditService->log(
                event: 'penalty.settled',
                auditable: $penalty,
                before: ['status' => 'pending'],
                after: ['status' => 'paid', 'payment_id' => $payment->id],
                equbGroupId: $penalty->equb_group_id
            );

            return $payment;
        });
    }

    public function getGroupPenalties(EqubGroup $group): Collection
    {
        return $group->penalties()
            ->with(['memberProfile', 'membership', 'assessor', 'waiver', 'waiverRequests.requester', 'waiverRequests.reviewer'])
            ->orderByDesc('id')
            ->get();
    }
}
