<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\EqubGroup;
use App\Models\LotteryDraw;
use App\Services\LotteryService;
use App\Services\PayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LotteryController extends Controller
{
    public function __construct(
        protected LotteryService $lotteryService,
        protected PayoutService $payoutService
    ) {}

    /**
     * List all lottery draws for the group's active cycle.
     */
    public function index(EqubGroup $group): Response
    {
        $this->authorize('view', $group);

        $cycle = $group->activeCycle;
        $draws = $cycle
            ? $this->lotteryService->getDrawsForCycle($cycle)
            : collect();

        $commencementCheck = $this->payoutService->canCommencePayouts($group);

        return Inertia::render('groups/lottery/index', [
            'group' => $group->load('activeRule'),
            'cycle' => $cycle,
            'draws' => $draws,
            'canCommence' => $commencementCheck['can_commence'],
            'commencementBlockedReasons' => $commencementCheck['reasons'],
        ]);
    }

    /**
     * Show eligible participants for the next draw position.
     */
    public function prepare(EqubGroup $group): Response
    {
        $this->authorize('update', $group);

        $cycle = $group->activeCycle;

        if (! $cycle) {
            return Inertia::render('groups/lottery/index', [
                'group' => $group->load('activeRule'),
                'cycle' => null,
                'draws' => collect(),
                'canCommence' => false,
                'commencementBlockedReasons' => ['No active cycle found.'],
            ]);
        }

        $eligibleMemberships = $this->lotteryService->getEligibleParticipants($group, $cycle);
        $existingDraws = $this->lotteryService->getDrawsForCycle($cycle);
        $nextSequence = $existingDraws->count() + 1;

        return Inertia::render('groups/lottery/prepare', [
            'group' => $group->load('activeRule'),
            'cycle' => $cycle,
            'nextSequence' => $nextSequence,
            'eligibleMembers' => $eligibleMemberships->map(fn ($m) => [
                'id' => $m->id,
                'full_name' => $m->memberProfile?->full_name,
                'membership_number' => $m->membership_number,
                'role' => $m->role->value,
            ])->values(),
            'existingDraws' => $existingDraws,
        ]);
    }

    /**
     * Conduct the lottery draw — server-side CSPRNG selection.
     * Returns JSON so the frontend can animate the result without page swap.
     */
    public function conduct(Request $request, EqubGroup $group): JsonResponse
    {
        $this->authorize('update', $group);

        $validated = $request->validate([
            'payout_sequence' => ['required', 'integer', 'min:1'],
            'witnessed_by_name' => ['nullable', 'string', 'max:150'],
            'witnessed_by_role' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $cycle = $group->activeCycle;
        if (! $cycle) {
            return response()->json(['error' => 'No active cycle found.'], 422);
        }

        try {
            $draw = $this->lotteryService->conductDraw(
                group: $group,
                cycle: $cycle,
                payoutSequence: $validated['payout_sequence'],
                conductor: $request->user(),
                method: 'random_server',
                witnessedByName: $validated['witnessed_by_name'] ?? null,
                witnessedByRole: $validated['witnessed_by_role'] ?? null,
                notes: $validated['notes'] ?? null,
            );

            $this->lotteryService->assignWinnerToPayout($draw, $request->user());

            $winner = $draw->winningMembership;
            $winnerProfile = $winner?->memberProfile;

            return response()->json([
                'success' => true,
                'draw_id' => $draw->id,
                'payout_sequence' => $draw->payout_sequence,
                'winning_membership_id' => $winner?->id,
                'winner_name' => $winnerProfile?->full_name,
                'winner_membership_number' => $winner?->membership_number,
                'winner_role' => $winner?->role?->value,
                'eligible_count' => $draw->eligible_count,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => collect($e->errors())->flatten()->first(),
            ], 422);
        }
    }

    /**
     * Re-run a lottery draw — used when the selected winner declines.
     * Excludes the previous winner and selects a new one from the remaining pool.
     * Returns JSON for the frontend animation.
     */
    public function rerun(Request $request, EqubGroup $group): JsonResponse
    {
        $this->authorize('update', $group);

        $validated = $request->validate([
            'payout_sequence' => ['required', 'integer', 'min:1'],
            'exclude_membership_id' => ['required', 'integer'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $cycle = $group->activeCycle;
        if (! $cycle) {
            return response()->json(['error' => 'No active cycle found.'], 422);
        }

        try {
            $draw = $this->lotteryService->conductDraw(
                group: $group,
                cycle: $cycle,
                payoutSequence: $validated['payout_sequence'],
                conductor: $request->user(),
                method: 'random_server',
                notes: ($validated['notes'] ?? '').' Re-run: previous winner declined.',
                allowRerun: true,
                excludeMembershipId: $validated['exclude_membership_id'],
            );

            $this->lotteryService->assignWinnerToPayout($draw, $request->user());

            $winner = $draw->winningMembership;
            $winnerProfile = $winner?->memberProfile;

            return response()->json([
                'success' => true,
                'draw_id' => $draw->id,
                'payout_sequence' => $draw->payout_sequence,
                'winning_membership_id' => $winner?->id,
                'winner_name' => $winnerProfile?->full_name,
                'winner_membership_number' => $winner?->membership_number,
                'winner_role' => $winner?->role?->value,
                'eligible_count' => $draw->eligible_count,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => collect($e->errors())->flatten()->first(),
            ], 422);
        }
    }

    /**
     * Show the detail of a single lottery draw (for audit inspection).
     */
    public function show(EqubGroup $group, LotteryDraw $draw): Response
    {
        $this->authorize('view', $group);

        return Inertia::render('groups/lottery/show', [
            'group' => $group->load('activeRule'),
            'draw' => $draw->load([
                'winningMembership.memberProfile',
                'conductedBy',
                'participants.membership.memberProfile',
                'payouts',
            ]),
        ]);
    }
}
