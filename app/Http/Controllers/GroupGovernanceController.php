<?php

namespace App\Http\Controllers;

use App\Enums\MembershipStatus;
use App\Models\EqubGroup;
use App\Models\GroupDecision;
use App\Services\GroupDecisionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Member governance: decisions, voting, and recorded outcomes.
 */
class GroupGovernanceController extends Controller
{
    public function __construct(
        protected GroupDecisionService $decisionService,
    ) {}

    public function index(Request $request, EqubGroup $group): Response
    {
        $user = $request->user();

        // Close any decisions whose voting window has elapsed so tallies are
        // always current when members view the board.
        $group->decisions()
            ->where('status', 'open')
            ->where('closes_at', '<=', now())
            ->get()
            ->each(fn (GroupDecision $decision) => $this->decisionService->closeIfDue($decision));

        $decisions = $group->decisions()
            ->with(['createdBy', 'votes'])
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        // My active membership + my votes, for the frontend canVote display.
        $myMembership = $user->memberProfile?->memberships()
            ->where('equb_group_id', $group->id)
            ->where('status', MembershipStatus::Active->value)
            ->first();

        $myVotes = $user->id
            ? $group->decisions()->join('group_decision_votes', function ($join) use ($user) {
                $join->on('group_decisions.id', '=', 'group_decision_votes.group_decision_id')
                    ->where('group_decision_votes.user_id', $user->id);
            })->pluck('group_decision_votes.vote', 'group_decisions.id')
            : collect();

        return Inertia::render('groups/governance/index', [
            'group' => $group,
            'decisions' => $decisions,
            'myMembership' => $myMembership,
            'myVotes' => $myVotes,
        ]);
    }

    /**
     * Open a new decision for the group.
     */
    public function store(Request $request, EqubGroup $group): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', 'in:general,rule_change'],
            'decision_payload' => ['nullable', 'array'],
            'closes_at' => ['required', 'date', 'after:now'],
        ]);

        $this->decisionService->createDecision($group, $validated, $request->user());

        return redirect()->back()->with('success', 'Decision opened for voting.');
    }

    /**
     * Cast the current user's vote on a decision.
     */
    public function vote(Request $request, EqubGroup $group, GroupDecision $decision): RedirectResponse
    {
        abort_unless($decision->equb_group_id === $group->id, 404);

        $validated = $request->validate([
            'vote' => ['required', 'in:approve,reject,abstain'],
        ]);

        $this->decisionService->castVote($decision, $request->user(), $validated['vote']);

        return redirect()->back()->with('success', 'Your vote was recorded.');
    }

    /**
     * Close a decision and record tallies.
     */
    public function close(Request $request, EqubGroup $group, GroupDecision $decision): RedirectResponse
    {
        abort_unless($decision->equb_group_id === $group->id, 404);

        $closed = $this->decisionService->closeDecision($decision, $request->user());

        return redirect()->back()->with(
            'success',
            $closed->isPassed()
                ? 'Decision closed: PASSED by member vote.'
                : 'Decision closed: not passed.'
        );
    }
}
