<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ContributionObligation;
use App\Models\ContributionPeriod;
use App\Models\EqubGroup;
use App\Models\Payment;
use App\Services\ContributionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContributionController extends Controller
{
    public function __construct(
        protected ContributionService $contributionService
    ) {}

    public function index(EqubGroup $group): Response
    {
        $this->authorize('view', $group);

        $periods = $group->contributionPeriods()
            ->withCount(['obligations as verified_count' => fn ($q) => $q->where('status', 'verified')])
            ->withCount('obligations as total_obligations_count')
            ->orderBy('sequence')
            ->get();

        $statusBoard = $this->contributionService->getGroupStatusBoard($group);

        return Inertia::render('groups/contributions/index', [
            'group' => $group->load(['activeRule']),
            'periods' => $periods,
            'statusBoard' => $statusBoard,
        ]);
    }

    public function generatePeriods(Request $request, EqubGroup $group): RedirectResponse
    {
        $this->authorize('update', $group);

        $cycle = $group->activeCycle;
        if (! $cycle) {
            return back()->withErrors(['cycle' => 'An active cycle must exist before generating contribution periods.']);
        }

        $this->contributionService->generateContributionPeriods($group, $cycle, $request->user());

        return back()->with('success', 'Contribution periods generated successfully for the cycle rotation.');
    }

    public function show(EqubGroup $group, ContributionPeriod $period): Response
    {
        $this->authorize('view', $group);

        $obligations = $period->obligations()
            ->with(['memberProfile', 'membership', 'allocations.payment.submittedBy'])
            ->get();

        return Inertia::render('groups/contributions/period-show', [
            'group' => $group->load('activeRule'),
            'period' => $period,
            'obligations' => $obligations,
            'currentUserId' => auth()->id(),
            'isSuperAdmin' => auth()->user()?->isSuperAdmin() ?? false,
        ]);
    }

    public function generateObligations(Request $request, EqubGroup $group, ContributionPeriod $period): RedirectResponse
    {
        $this->authorize('update', $group);

        $this->contributionService->generateMemberObligations($period, $request->user());

        return back()->with('success', "Member obligations generated for {$period->label}.");
    }

    public function submitPayment(Request $request, EqubGroup $group, ContributionObligation $obligation): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'method' => ['required', 'string'],
            'reference' => ['nullable', 'string', 'max:100'],
            'paid_on' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->contributionService->recordContributionPayment($obligation, $validated, $request->user());

        return back()->with('success', 'Contribution payment recorded and queued for verification.');
    }

    public function verifyPayment(Request $request, EqubGroup $group, Payment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:verified,rejected'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $this->contributionService->verifyContributionPayment(
            $payment,
            $request->user(),
            $validated['decision'],
            $validated['reason'] ?? null
        );

        $msg = $validated['decision'] === 'verified'
            ? 'Contribution payment verified successfully.'
            : 'Contribution payment rejected.';

        return back()->with('success', $msg);
    }

    public function statusBoard(EqubGroup $group): Response
    {
        $this->authorize('view', $group);

        $statusBoard = $this->contributionService->getGroupStatusBoard($group);
        $periods = $group->contributionPeriods()->orderBy('sequence')->get();

        return Inertia::render('groups/contributions/status-board', [
            'group' => $group->load('activeRule'),
            'statusBoard' => $statusBoard,
            'periods' => $periods,
        ]);
    }
}
