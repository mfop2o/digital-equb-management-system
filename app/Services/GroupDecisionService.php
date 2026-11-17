<?php

namespace App\Services;

use App\Enums\GroupDecisionStatus;
use App\Enums\GroupDecisionType;
use App\Enums\GroupStatus;
use App\Enums\MembershipStatus;
use App\Models\EqubGroup;
use App\Models\GroupDecision;
use App\Models\GroupDecisionVote;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Member governance: group decisions and voting.
 *
 * Decisions are immutable once closed. Every eligible active member may cast
 * one vote; tallies are recomputed on close and stored on the decision.
 *
 * Quorum and coordinator election are intentionally NOT invented here — they
 * are pending product decisions. Simple majority (approvals > rejections)
 * decides a vote today.
 */
class GroupDecisionService
{
    public function __construct(
        protected AuditService $auditService,
    ) {}

    /**
     * Create a new open decision for the group.
     *
     * @param  array<string, mixed>  $data
     */
    public function createDecision(EqubGroup $group, array $data, User $creator): GroupDecision
    {
        return DB::transaction(function () use ($group, $data, $creator) {
            $decision = $group->decisions()->create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'] ?? GroupDecisionType::General->value,
                'decision_payload' => $data['decision_payload'] ?? null,
                'status' => GroupDecisionStatus::Open,
                'closes_at' => $data['closes_at'],
                'created_by_user_id' => $creator->id,
            ]);

            $this->auditService->log(
                event: 'governance.decision_created',
                auditable: $decision,
                after: ['decision_id' => $decision->id, 'title' => $decision->title, 'type' => $decision->type->value],
                equbGroupId: $group->id,
            );

            return $decision;
        });
    }

    /**
     * Record an active member's vote on an open decision (one per member).
     *
     * @param 'approve'|'reject'|'abstain' $vote
     */
    public function castVote(GroupDecision $decision, User $user, string $vote): GroupDecisionVote
    {
        return DB::transaction(function () use ($decision, $user, $vote) {
            $decision = $this->closeIfDue($decision);

            if (! $decision->isOpen()) {
                throw ValidationException::withMessages([
                    'decision' => 'This decision is no longer open for voting.',
                ]);
            }

            $group = $decision->group;

            $isMember = $group->memberships()
                ->where('member_profile_id', $user->memberProfile?->id)
                ->where('status', MembershipStatus::Active->value)
                ->exists();

            if (! $isMember && ! $user->hasRole('admin')) {
                throw ValidationException::withMessages([
                    'decision' => 'Only active members of this group may vote.',
                ]);
            }

            if (! in_array($vote, ['approve', 'reject', 'abstain'], true)) {
                throw ValidationException::withMessages([
                    'vote' => 'Invalid vote choice.',
                ]);
            }

            $existing = $decision->votes()->where('user_id', $user->id)->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'decision' => 'You have already voted on this decision.',
                ]);
            }

            $recorded = $decision->votes()->create([
                'user_id' => $user->id,
                'vote' => $vote,
                'voted_at' => now(),
            ]);

            $this->auditService->log(
                event: 'governance.vote_cast',
                auditable: $decision,
                after: ['decision_id' => $decision->id, 'vote' => $vote],
                equbGroupId: $decision->equb_group_id,
            );

            return $recorded;
        });
    }

    /**
     * Close a decision and record immutable tallies.
     */
    public function closeDecision(GroupDecision $decision, ?User $actor = null): GroupDecision
    {
        return DB::transaction(function () use ($decision, $actor) {
            $decision = $this->closeIfDue($decision);

            if (! $decision->isOpen()) {
                return $decision;
            }

            return $this->closeWithTallies($decision, $actor);
        });
    }

    /**
     * Lazily close any open decision whose voting window has elapsed.
     */
    public function closeIfDue(GroupDecision $decision): GroupDecision
    {
        if ($decision->isOpen() && $decision->isPastClosesAt()) {
            return $this->closeWithTallies($decision, null);
        }

        return $decision->fresh() ?? $decision;
    }

    /**
     * Close every due open decision across all groups (scheduled command).
     *
     * @return int number of decisions closed
     */
    public function closeAllDue(): int
    {
        $dueIds = GroupDecision::query()
            ->where('status', GroupDecisionStatus::Open->value)
            ->where('closes_at', '<=', now())
            ->pluck('id');

        $closed = 0;

        foreach ($dueIds as $id) {
            $decision = GroupDecision::find($id);

            if ($decision && $decision->isOpen()) {
                $this->closeWithTallies($decision, null);
                $closed++;
            }
        }

        return $closed;
    }

    private function closeWithTallies(GroupDecision $decision, ?User $actor): GroupDecision
    {
        $tallies = $decision->votes()
            ->selectRaw("vote, count(*) as total")
            ->groupBy('vote')
            ->pluck('total', 'vote');

        $approves = (int) ($tallies['approve'] ?? 0);
        $rejects = (int) ($tallies['reject'] ?? 0);
        $abstains = (int) ($tallies['abstain'] ?? 0);

        $passed = $approves > $rejects && ($approves + $rejects) > 0;

        $decision->update([
            'status' => $passed ? GroupDecisionStatus::Passed : GroupDecisionStatus::Failed,
            'closed_at' => now(),
            'closed_by_user_id' => $actor?->id,
            'approves_count' => $approves,
            'rejects_count' => $rejects,
            'abstains_count' => $abstains,
        ]);

        $this->auditService->log(
            event: 'governance.decision_closed',
            auditable: $decision,
            after: [
                'decision_id' => $decision->id,
                'result' => $decision->status->value,
                'approves' => $approves,
                'rejects' => $rejects,
                'abstains' => $abstains,
            ],
            equbGroupId: $decision->equb_group_id,
        );

        return $decision->fresh() ?? $decision;
    }
}
