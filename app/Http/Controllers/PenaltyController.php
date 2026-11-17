<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\EqubGroup;
use App\Models\Penalty;
use App\Models\PenaltyWaiverRequest;
use App\Services\PenaltyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PenaltyController extends Controller
{
    public function __construct(protected PenaltyService $penaltyService) {}

    public function index(EqubGroup $group): Response
    {
        $penalties = $this->penaltyService->getGroupPenalties($group);
        $waiverRequests = PenaltyWaiverRequest::whereHas('penalty', fn ($q) => $q->where('equb_group_id', $group->id))
            ->with('penalty.memberProfile')
            ->orderByDesc('id')
            ->get();

        $summary = [
            'total' => $penalties->count(),
            'pending' => $penalties->where('status', 'pending')->count(),
            'paid' => $penalties->where('status', 'paid')->count(),
            'waived' => $penalties->where('status', 'waived')->count(),
            'total_amount' => number_format($penalties->sum('amount'), 2, '.', ''),
            'pending_amount' => number_format($penalties->where('status', 'pending')->sum('amount'), 2, '.', ''),
        ];

        return Inertia::render('groups/penalties/index', [
            'group' => $group->load('activeCycle'),
            'penalties' => $penalties,
            'waiverRequests' => $waiverRequests,
            'summary' => $summary,
        ]);
    }

    public function assess(Request $request, EqubGroup $group): RedirectResponse
    {
        $assessed = $this->penaltyService->assessLatePenalties(
            group: $group,
            actor: $request->user(),
        );

        return back()->with('success', "Assessed {$assessed->count()} late-payment penalties.");
    }

    public function requestWaiver(Request $request, EqubGroup $group, Penalty $penalty): RedirectResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:10'],
        ]);

        $this->penaltyService->requestWaiver(
            penalty: $penalty,
            reason: $request->input('reason'),
            requester: $request->user(),
        );

        return back()->with('success', 'Waiver request submitted for review.');
    }

    public function reviewWaiver(Request $request, EqubGroup $group, PenaltyWaiverRequest $waiver): RedirectResponse
    {
        $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'reviewer_notes' => ['nullable', 'string'],
        ]);

        $this->penaltyService->reviewWaiver(
            request: $waiver,
            decision: $request->input('decision'),
            reason: $request->input('reviewer_notes'),
            reviewer: $request->user(),
        );

        return back()->with('success', 'Waiver request '.$request->input('decision').'.');
    }

    public function settle(Request $request, EqubGroup $group, Penalty $penalty): RedirectResponse
    {
        $request->validate([
            'payment_method' => ['required', 'string'],
            'reference_number' => ['nullable', 'string'],
        ]);

        $this->penaltyService->settlePenalty(
            penalty: $penalty,
            paymentData: [
                'method' => $request->input('payment_method'),
                'reference' => $request->input('reference_number'),
                'paid_on' => now()->toDateString(),
            ],
            submitter: $request->user(),
        );

        return back()->with('success', 'Penalty settled successfully.');
    }
}
