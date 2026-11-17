<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MembershipStatus;
use App\Models\EqubGroup;
use App\Models\EqubMembership;
use App\Models\MemberWithdrawal;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WithdrawalService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    public function requestWithdrawal(EqubMembership $membership, string $reason, User $requester): MemberWithdrawal
    {
        return DB::transaction(function () use ($membership, $reason, $requester) {
            if ($membership->status !== MembershipStatus::Active) {
                throw ValidationException::withMessages([
                    'membership' => ['Only active memberships can submit a withdrawal request.'],
                ]);
            }

            // Invariant: members who have already taken a payout cannot withdraw without full settlement
            if ($membership->hasReceivedPayout()) {
                throw ValidationException::withMessages([
                    'membership' => ['Member has already received a payout pot in this cycle and cannot withdraw without settling remaining cycle contributions.'],
                ]);
            }

            $withdrawal = MemberWithdrawal::create([
                'equb_group_id' => $membership->equb_group_id,
                'equb_membership_id' => $membership->id,
                'member_profile_id' => $membership->member_profile_id,
                'reason' => $reason,
                'status' => 'requested',
                'settlement_type' => 'deferred_cycle_end', // Decision D-08
                'settlement_amount' => 0.00,
                'requested_by' => $requester->id,
            ]);

            $this->auditService->log(
                event: 'withdrawal.requested',
                auditable: $withdrawal,
                before: [],
                after: ['membership_id' => $membership->id, 'reason' => $reason],
                equbGroupId: $membership->equb_group_id
            );

            return $withdrawal;
        });
    }

    public function reviewWithdrawal(MemberWithdrawal $withdrawal, string $decision, ?string $notes, User $reviewer): MemberWithdrawal
    {
        return DB::transaction(function () use ($withdrawal, $decision, $notes, $reviewer) {
            // Maker-Checker Check
            if ($withdrawal->requested_by === $reviewer->id) {
                throw ValidationException::withMessages([
                    'reviewer' => ['Maker-checker violation: the user who submitted the withdrawal request cannot approve it.'],
                ]);
            }

            if ($withdrawal->status !== 'requested') {
                throw ValidationException::withMessages([
                    'withdrawal' => ['This withdrawal request has already been processed.'],
                ]);
            }

            if ($decision === 'approved') {
                $withdrawal->update([
                    'status' => 'approved',
                    'approved_by' => $reviewer->id,
                    'notes' => $notes,
                ]);

                // Transition membership status to Withdrawn
                $withdrawal->membership->update([
                    'status' => MembershipStatus::Withdrawn,
                ]);

                $this->auditService->log(
                    event: 'withdrawal.approved',
                    auditable: $withdrawal,
                    before: ['status' => 'requested'],
                    after: ['status' => 'approved', 'approved_by' => $reviewer->id],
                    equbGroupId: $withdrawal->equb_group_id
                );
            } else {
                $withdrawal->update([
                    'status' => 'rejected',
                    'approved_by' => $reviewer->id,
                    'notes' => $notes,
                ]);

                $this->auditService->log(
                    event: 'withdrawal.rejected',
                    auditable: $withdrawal,
                    before: ['status' => 'requested'],
                    after: ['status' => 'rejected', 'reviewed_by' => $reviewer->id],
                    equbGroupId: $withdrawal->equb_group_id
                );
            }

            return $withdrawal->fresh();
        });
    }

    public function getGroupWithdrawals(EqubGroup $group): Collection
    {
        return $group->withdrawals()
            ->with(['memberProfile', 'membership', 'requester', 'approver', 'settler'])
            ->orderByDesc('id')
            ->get();
    }
}
