<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\EqubGroup;
use App\Services\FinancialLedgerService;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function __construct(
        protected FinancialLedgerService $ledgerService
    ) {}

    public function index(EqubGroup $group): Response
    {
        $this->ledgerService->setupChartOfAccounts($group, auth()->user());

        $trialBalance = $this->ledgerService->getTrialBalance($group);
        $recentEntries = $this->ledgerService->getGeneralLedger($group)->take(10)->values();

        return Inertia::render('groups/finance/index', [
            'group' => $group->load('activeCycle'),
            'trialBalance' => $trialBalance,
            'recentEntries' => $recentEntries,
        ]);
    }

    public function ledger(EqubGroup $group): Response
    {
        $this->ledgerService->setupChartOfAccounts($group, auth()->user());

        $entries = $this->ledgerService->getGeneralLedger($group)->values();

        return Inertia::render('groups/finance/ledger', [
            'group' => $group->load('activeCycle'),
            'ledger' => $entries,
        ]);
    }
}
