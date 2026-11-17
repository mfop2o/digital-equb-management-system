<?php

namespace App\Services;

use App\Enums\GroupStatus;
use App\Enums\GroupVisibility;
use App\Enums\MembershipMode;
use App\Enums\MembershipStatus;
use App\Models\EqubGroup;
use App\Models\MembershipRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Self-service membership: join requests, invite codes, and approvals.
 *
 * A user joins through either an open request (public group) or an invite
 * code (private/invite-only group). When the group's rule mode is
 * `auto_admit`, an eligible request becomes an active membership immediately;
 * otherwise a group organizer approves or rejects it.
 */
class MembershipRequestService
{
    public function __construct(
        protected EqubGroupService $groupService,
        protected AuditService $auditService,
    ) {}

    /**
     * Request to join a group directly (public groups only).
     */
    public function requestToJoin(EqubGroup $group, User $user, ?string $notes = null): MembershipRequest
    {
        if (! $group->visibility->acceptsOpenRequests()) {
            throw ValidationException::withMessages([
                'group' => 'This group is not open for direct join requests. An invite code is required.',
            ]);
        }

        return $this->createRequest($group, $user, $notes);
    }

    /**
     * Request to join a group using an invite code.
     */
    public function joinByCode(string $code, User $user, ?string $notes = null): MembershipRequest
    {
        $group = EqubGroup::where('invite_code', strtoupper(trim($code)))->first();

        if (! $group) {
            throw ValidationException::withMessages([
                'code' => 'This invite code is not valid.',
            ]);
        }

        if (! in_array($group->status, [GroupStatus::Registration, GroupStatus::DepositStage, GroupStatus::Active], true)) {
            throw ValidationException::withMessages([
                'code' => 'This group is not accepting new members.',
            ]);
        }

        return $this->createRequest($group, $user, $notes);
    }

    /**
     * Approve a pending request → enroll the member.
     */
    public function approve(MembershipRequest $request, User $approver): void
    {
        DB::transaction(function () use ($request, $approver) {
            if ($request->status !== 'pending') {
                throw ValidationException::withMessages([
                    'request' => 'This membership request was already reviewed.',
                ]);
            }

            $group = $request->group;
            $profile = $request->memberProfile;

            $membership = $this->groupService->enrollMember(
                group: $group,
                profile: $profile,
                actor: $approver,
            );

            $request->update([
                'status' => 'approved',
                'reviewed_by_user_id' => $approver->id,
                'reviewed_at' => now(),
            ]);

            $this->auditService->log(
                event: 'membership.request_approved',
                auditable: $request,
                after: [
                    'request_id' => $request->id,
                    'membership_id' => $membership->id,
                    'member_number' => $profile->member_number,
                ],
                equbGroupId: $group->id,
            );
        });
    }

    /**
     * Reject a pending request with a reason.
     */
    public function reject(MembershipRequest $request, User $reviewer, ?string $reason = null): void
    {
        DB::transaction(function () use ($request, $reviewer, $reason) {
            if ($request->status !== 'pending') {
                throw ValidationException::withMessages([
                    'request' => 'This membership request was already reviewed.',
                ]);
            }

            $request->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'reviewed_by_user_id' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            $this->auditService->log(
                event: 'membership.request_rejected',
                auditable: $request,
                after: ['request_id' => $request->id, 'reason' => $reason],
                equbGroupId: $request->equb_group_id,
            );
        });
    }

    private function createRequest(EqubGroup $group, User $user, ?string $notes): MembershipRequest
    {
        if (! in_array($group->status, [GroupStatus::Registration, GroupStatus::DepositStage, GroupStatus::Active], true)) {
            throw ValidationException::withMessages([
                'group' => 'This group is not accepting new members.',
            ]);
        }

        if ($group->isFull()) {
            throw ValidationException::withMessages([
                'group' => "This Equb group has reached its maximum capacity of {$group->max_members} members.",
            ]);
        }

        $profile = $user->memberProfile;

        if (! $profile) {
            throw ValidationException::withMessages([
                'group' => 'A member profile is required before joining a group.',
            ]);
        }

        if ($group->memberships()->where('member_profile_id', $profile->id)->exists()) {
            throw ValidationException::withMessages([
                'group' => 'You are already a member of this group.',
            ]);
        }

        $existing = MembershipRequest::where('equb_group_id', $group->id)
            ->where('member_profile_id', $profile->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'group' => 'You already have a pending membership request for this group.',
            ]);
        }

        $membershipRequest = MembershipRequest::create([
            'equb_group_id' => $group->id,
            'member_profile_id' => $profile->id,
            'requested_role' => 'member',
            'status' => 'pending',
            'notes' => $notes,
        ]);

        $this->auditService->log(
            event: 'membership.request_created',
            auditable: $membershipRequest,
            after: ['request_id' => $membershipRequest->id, 'group' => $group->group_code],
            equbGroupId: $group->id,
        );

        // Groups configured for automatic admission enroll eligible members
        // immediately; otherwise an organizer must approve the request.
        $rule = $group->activeRule;

        if ($rule && $rule->membership_mode === MembershipMode::AutoAdmit) {
            $this->approve($membershipRequest, $user);
            $membershipRequest->refresh();
        }

        return $membershipRequest;
    }
}
