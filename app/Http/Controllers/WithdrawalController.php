<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\EqubGroup;
use App\Models\EqubMembership;
use App\Models\MemberWithdrawal;
use App\Services\WithdrawalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WithdrawalController extends Controller
{
    public function __construct(protected WithdrawalService $withdrawalService) {}

    public function index(EqubGroup $group): Response
    {
        $withdrawals = $this->withdrawalService->getGroupWithdrawals($group);

        $summary = [
            'total' => $withdrawals->count(),
            'pending' => $withdrawals->where('status', 'requested')->count(),
            'approved' => $withdrawals->where('status', 'approved')->count(),
            'rejected' => $withdrawals->where('status', 'rejected')->count(),
        ];

        return Inertia::render('groups/withdrawals/index', [
            'group' => $group->load('activeCycle'),
            'withdrawals' => $withdrawals,
            'summary' => $summary,
        ]);
    }

    public function store(Request $request, EqubGroup $group, EqubMembership $membership): RedirectResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:10'],
        ]);

        $this->withdrawalService->requestWithdrawal(
            membership: $membership,
            reason: $request->input('reason'),
            requester: $request->user(),
        );

        return back()->with('success', 'Withdrawal request submitted for review.');
    }

    public function review(Request $request, EqubGroup $group, MemberWithdrawal $withdrawal): RedirectResponse
    {
        $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'reviewer_notes' => ['nullable', 'string'],
        ]);

        $this->withdrawalService->reviewWithdrawal(
            withdrawal: $withdrawal,
            decision: $request->input('decision'),
            notes: $request->input('reviewer_notes'),
            reviewer: $request->user(),
        );

        return back()->with('success', 'Withdrawal request '.$request->input('decision').'.');
    }
}
