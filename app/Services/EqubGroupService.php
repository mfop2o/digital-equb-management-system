<?php

namespace App\Services;

use App\Enums\ContributionFrequency;
use App\Enums\GroupRole;
use App\Enums\GroupStatus;
use App\Enums\GroupVisibility;
use App\Enums\InitialDepositTreatment;
use App\Enums\MembershipMode;
use App\Enums\MembershipStatus;
use App\Enums\PayoutCommencementRule;
use App\Enums\RotationMethod;
use App\Models\EqubGroup;
use App\Models\EqubGroupRule;
use App\Models\EqubMembership;
use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EqubGroupService
{
    public function __construct(
        protected AuditService $auditService,
        protected StatusWorkflowService $statusWorkflow
    ) {}

    /**
     * Create a new Equb group with its first version of configured rules.
     */
    public function createGroup(array $groupData, array $ruleData, User $creator): EqubGroup
    {
        return DB::transaction(function () use ($groupData, $ruleData, $creator) {
            $groupCode = $this->generateGroupCode();

            $group = EqubGroup::create([
                'name' => $groupData['name'],
                'group_code' => $groupCode,
                'description' => $groupData['description'] ?? null,
                'category' => $groupData['category'] ?? 'General',
                'location' => $groupData['location'] ?? null,
                'status' => GroupStatus::Draft,
                'visibility' => $groupData['visibility'] ?? GroupVisibility::Public->value,
                'invite_code' => $this->generateInviteCode(),
                'max_members' => $groupData['max_members'] ?? 20,
                'created_by_user_id' => $creator->id,
            ]);

            // Create initial rule set (version 1)
            $this->configureRules($group, $ruleData, $creator, version: 1);

            // Assign creator to staff pivot if they hold an administrative/organizer role
            $group->staffUsers()->attach($creator->id, [
                'role' => 'organizer',
                'is_active' => true,
            ]);

            $this->auditService->log(
                event: 'group.created',
                auditable: $group,
                after: ['id' => $group->id, 'name' => $group->name, 'group_code' => $group->group_code],
                equbGroupId: $group->id,
            );

            return $group;
        });
    }

    /**
     * Configure or update group rules (versioned).
     */
    public function configureRules(EqubGroup $group, array $data, User $actor, int $version = 1): EqubGroupRule
    {
        return DB::transaction(function () use ($group, $data, $actor, $version) {
            // Deactivate older active rules
            $group->rules()->where('is_active', true)->update(['is_active' => false]);

            // Confirmed rule: initial deposits are accumulated and retained by the group.
            // Their later distribution/refund policy is a pending business decision.
            $rule = $group->rules()->create([
                'contribution_amount' => $data['contribution_amount'],
                'contribution_frequency' => $data['contribution_frequency'] ?? ContributionFrequency::Monthly->value,
                'expected_members' => $data['expected_members'] ?? $group->max_members,
                'initial_deposit_rounds' => $data['initial_deposit_rounds'] ?? 0,
                'initial_deposit_amount' => $data['initial_deposit_amount'] ?? 0.00,
                'initial_deposit_treatment' => $data['initial_deposit_treatment'] ?? InitialDepositTreatment::Retained->value,
                'membership_mode' => $data['membership_mode'] ?? MembershipMode::ApprovalRequired->value,
                'payout_commencement_rule' => $data['payout_commencement_rule'] ?? PayoutCommencementRule::DepositCompletionAndDate->value,
                'payout_commencement_date' => $data['payout_commencement_date'] ?? null,
                'rotation_method' => $data['rotation_method'] ?? RotationMethod::Predetermined->value,
                'allow_partial_contributions' => $data['allow_partial_contributions'] ?? false,
                'late_penalty_enabled' => $data['late_penalty_enabled'] ?? true,
                'late_penalty_fixed_amount' => $data['late_penalty_fixed_amount'] ?? 0.00,
                'late_penalty_daily_rate' => $data['late_penalty_daily_rate'] ?? 0.00,
                'late_penalty_grace_days' => $data['late_penalty_grace_days'] ?? 3,
                'withdrawal_refund_treatment' => $data['withdrawal_refund_treatment'] ?? 'deferred_cycle_end',
                'terms_and_conditions' => $data['terms_and_conditions'] ?? null,
                'is_active' => true,
                'version' => $version,
                'configured_by_user_id' => $actor->id,
            ]);

            $this->auditService->log(
                event: 'group.rules_configured',
                auditable: $rule,
                after: ['rule_id' => $rule->id, 'version' => $version, 'contribution_amount' => $rule->contribution_amount],
                equbGroupId: $group->id,
            );

            return $rule;
        });
    }

    /**
     * Enroll a member into an Equb group.
     */
    public function enrollMember(
        EqubGroup $group,
        MemberProfile $profile,
        GroupRole $role = GroupRole::Member,
        ?int $payoutOrder = null,
        ?User $actor = null,
    ): EqubMembership {
        return DB::transaction(function () use ($group, $profile, $role, $payoutOrder, $actor) {
            if ($group->isFull()) {
                throw ValidationException::withMessages([
                    'member_profile_id' => "This Equb group has reached its maximum capacity of {$group->max_members} members.",
                ]);
            }

            if ($group->memberships()->where('member_profile_id', $profile->id)->exists()) {
                throw ValidationException::withMessages([
                    'member_profile_id' => 'This member is already enrolled in this Equb group.',
                ]);
            }

            $currentCount = $group->memberships()->count();
            $membershipNumber = sprintf('%s-M%03d', $group->group_code, $currentCount + 1);

            $membership = $group->memberships()->create([
                'member_profile_id' => $profile->id,
                'membership_number' => $membershipNumber,
                'role' => $role,
                'payout_order_number' => $payoutOrder,
                'status' => MembershipStatus::Active,
                'joined_at' => now(),
                'approved_by_user_id' => $actor?->id,
                'terms_accepted_at' => now(),
            ]);

            // If the enrolled member is an organizer/treasurer/auditor and has an associated user account,
            // also record in the equb_group_user staff pivot
            if ($profile->user_id && in_array($role, [GroupRole::Organizer, GroupRole::Treasurer, GroupRole::Auditor])) {
                $group->staffUsers()->syncWithoutDetaching([
                    $profile->user_id => [
                        'role' => $role->value,
                        'is_active' => true,
                    ],
                ]);
            }

            $this->auditService->log(
                event: 'membership.enrolled',
                auditable: $membership,
                after: [
                    'membership_id' => $membership->id,
                    'member_number' => $profile->member_number,
                    'role' => $role->value,
                    'payout_order' => $payoutOrder,
                ],
                equbGroupId: $group->id,
            );

            return $membership;
        });
    }

    /**
     * Activate an Equb group for operation.
     */
    public function activateGroup(EqubGroup $group, User $actor): void
    {
        DB::transaction(function () use ($group, $actor) {
            if (! $group->activeRule) {
                throw ValidationException::withMessages([
                    'group' => 'Cannot activate a group without active rules.',
                ]);
            }

            $activeMembersCount = $group->activeMemberships()->count();
            if ($activeMembersCount === 0) {
                throw ValidationException::withMessages([
                    'group' => 'Cannot activate an Equb group with zero enrolled members.',
                ]);
            }

            // Use status workflow to handle proper status assignment
            $this->statusWorkflow->onGroupActivated($group);

            $this->auditService->log(
                event: 'group.activated',
                auditable: $group,
                after: ['status' => $group->fresh()->status->value, 'activated_by' => $actor->id],
                equbGroupId: $group->id,
            );
        });
    }

    protected function generateGroupCode(): string
    {
        $year = date('Y');
        $lastId = DB::table('equb_groups')->max('id') ?? 0;
        $nextId = $lastId + 1;

        return sprintf('EQB-%s-%03d', $year, $nextId);
    }

    /**
     * Generate a unique human-friendly invite code for joining the group.
     */
    protected function generateInviteCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (EqubGroup::where('invite_code', $code)->exists());

        return $code;
    }
}
