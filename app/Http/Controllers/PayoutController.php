<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\EqubGroup;
use App\Models\Payout;
use App\Services\PayoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayoutController extends Controller
{
    public function __construct(
        protected PayoutService $payoutService
    ) {}

    public function index(EqubGroup $group): Response
    {
        $this->authorize('view', $group);

        $commencementCheck = $this->payoutService->canCommencePayouts($group);
        $payouts = $this->payoutService->getPayoutSchedule($group);

        return Inertia::render('groups/payouts/index', [
            'group' => $group->load(['activeRule']),
            'payouts' => $payouts,
            'canCommence' => $commencementCheck['can_commence'],
            'commencementBlockedReasons' => $commencementCheck['reasons'],
            'currentUserId' => auth()->id(),
        ]);
    }

    public function schedule(Request $request, EqubGroup $group): RedirectResponse
    {
        $this->authorize('update', $group);

        $cycle = $group->activeCycle;
        if (! $cycle) {
            return back()->withErrors(['cycle' => 'An active Equb cycle must exist to schedule payout rotation.']);
        }

        $this->payoutService->schedulePayoutRotation($group, $cycle, $request->user());

        return back()->with('success', 'Equb payout rotation schedule generated successfully.');
    }

    public function show(EqubGroup $group, Payout $payout): Response
    {
        $this->authorize('view', $group);

        return Inertia::render('groups/payouts/show', [
            'group' => $group->load('activeRule'),
            'payout' => $payout->load(['memberProfile', 'membership', 'requester', 'approver', 'disburser']),
            'currentUserId' => auth()->id(),
            'isSuperAdmin' => auth()->user()?->isSuperAdmin() ?? false,
        ]);
    }

    public function requestApproval(Request $request, EqubGroup $group, Payout $payout): RedirectResponse
    {
        $this->payoutService->requestPayoutApproval($payout, $request->user());

        return back()->with('success', "Approval requested for Payout Slot #{$payout->payout_sequence}.");
    }

    public function approve(Request $request, EqubGroup $group, Payout $payout): RedirectResponse
    {
        $this->payoutService->approvePayout($payout, $request->user());

        return back()->with('success', "Payout Slot #{$payout->payout_sequence} approved for disbursement.");
    }

    public function disburse(Request $request, EqubGroup $group, Payout $payout): RedirectResponse
    {
        $validated = $request->validate([
            'method' => ['required', 'string'],
            'account_reference' => ['nullable', 'string', 'max:150'],
            'disbursed_on' => ['required', 'date'],
            'disbursement_reference' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->payoutService->disburse($payout, $validated, $request->user());

        return back()->with('success', "Payout Slot #{$payout->payout_sequence} successfully disbursed. Official receipt issued.");
    }

    public function complete(Request $request, EqubGroup $group, Payout $payout): RedirectResponse
    {
        $this->payoutService->complete($payout, $request->user());

        return back()->with('success', "Payout Slot #{$payout->payout_sequence} marked as completed.");
    }
}
