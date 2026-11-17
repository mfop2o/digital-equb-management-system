<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Deposits\OpenDepositRoundRequest;
use App\Http\Requests\Deposits\SubmitDepositPaymentRequest;
use App\Http\Requests\Deposits\VerifyDepositPaymentRequest;
use App\Models\DepositObligation;
use App\Models\DepositRound;
use App\Models\EqubGroup;
use App\Models\Payment;
use App\Services\DepositRoundService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepositRoundController extends Controller
{
    public function __construct(
        protected DepositRoundService $depositService
    ) {}

    public function index(EqubGroup $group): Response
    {
        $this->authorize('view', $group);

        $cycle = $group->activeCycle;
        $rounds = $group->depositRounds()
            ->with(['obligations.memberProfile', 'approver'])
            ->get();

        $accumulated = $this->depositService->calculateAccumulatedDeposits($group);

        return Inertia::render('groups/deposits/index', [
            'group' => $group->load(['activeRule']),
            'cycle' => $cycle,
            'rounds' => $rounds,
            'accumulated' => $accumulated,
        ]);
    }

    public function createCycle(Request $request, EqubGroup $group): RedirectResponse
    {
        $this->authorize('update', $group);

        $this->depositService->createCycleForGroup($group, $request->user());

        return back()->with('success', 'Equb cycle and initial deposit stage initialized successfully.');
    }

    public function store(OpenDepositRoundRequest $request, EqubGroup $group): RedirectResponse
    {
        $cycle = $group->activeCycle;
        if (! $cycle) {
            $cycle = $this->depositService->createCycleForGroup($group, $request->user());
        }

        $nextSequence = ($group->depositRounds()->max('sequence') ?? 0) + 1;

        $this->depositService->createDepositRound(
            $cycle,
            $nextSequence,
            $request->validated(),
            $request->user()
        );

        return back()->with('success', 'Initial deposit round created successfully.');
    }

    public function show(EqubGroup $group, DepositRound $round): Response
    {
        $this->authorize('view', $group);

        $obligations = $round->obligations()
            ->with(['memberProfile', 'membership', 'allocations.payment.submittedBy'])
            ->get();

        return Inertia::render('groups/deposits/round-show', [
            'group' => $group->load(['activeRule']),
            'round' => $round->load('approver'),
            'obligations' => $obligations,
            'currentUserId' => auth()->id(),
            'isSuperAdmin' => auth()->user()?->isSuperAdmin() ?? false,
        ]);
    }

    public function open(Request $request, EqubGroup $group, DepositRound $round): RedirectResponse
    {
        $this->authorize('update', $group);

        $this->depositService->openRound($round, $request->user());

        return back()->with('success', "Deposit round '{$round->label}' opened. Obligations generated for all participating members.");
    }

    public function close(Request $request, EqubGroup $group, DepositRound $round): RedirectResponse
    {
        $this->authorize('update', $group);

        $this->depositService->closeRound($round, $request->user());

        return back()->with('success', "Deposit round '{$round->label}' closed successfully.");
    }

    public function submitPayment(SubmitDepositPaymentRequest $request, EqubGroup $group, DepositObligation $obligation): RedirectResponse
    {
        $this->depositService->recordDepositPayment($obligation, $request->validated(), $request->user());

        return back()->with('success', 'Deposit payment recorded and queued for verification.');
    }

    public function verifyPayment(VerifyDepositPaymentRequest $request, EqubGroup $group, Payment $payment): RedirectResponse
    {
        $validated = $request->validated();

        $this->depositService->verifyDepositPayment(
            $payment,
            $request->user(),
            $validated['decision'],
            $validated['reason'] ?? null
        );

        $msg = $validated['decision'] === 'verified'
            ? 'Deposit payment verified successfully. Official receipt issued.'
            : 'Deposit payment rejected.';

        return back()->with('success', $msg);
    }
}
