<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AccountType;
use App\Models\EqubCycle;
use App\Models\EqubGroup;
use App\Models\FinancialAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinancialLedgerService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Standard chart of accounts template for an Equb Group.
     */
    public const DEFAULT_ACCOUNTS = [
        ['code' => '1010', 'name' => 'Bank Account (CBE / Commercial Banks)', 'type' => AccountType::Asset, 'subtype' => 'bank'],
        ['code' => '1000', 'name' => 'Cash on Hand', 'type' => AccountType::Asset, 'subtype' => 'cash'],
        ['code' => '1020', 'name' => 'Mobile Money Wallets (Telebirr / CBE Birr)', 'type' => AccountType::Asset, 'subtype' => 'mobile_money'],
        ['code' => '2010', 'name' => 'Retained Initial Deposits (distribution policy pending)', 'type' => AccountType::Liability, 'subtype' => 'fund'],
        ['code' => '2020', 'name' => "Members' Equb Contributions Pool", 'type' => AccountType::Liability, 'subtype' => 'fund'],
        ['code' => '4010', 'name' => 'Late Penalty Fees Income', 'type' => AccountType::Income, 'subtype' => 'penalty'],
        ['code' => '5010', 'name' => 'Bank Charges & Administration Expenses', 'type' => AccountType::Expense, 'subtype' => 'other'],
    ];

    public function setupChartOfAccounts(EqubGroup $group, User $actor): void
    {
        $scopeKey = "group:{$group->id}";

        foreach (self::DEFAULT_ACCOUNTS as $acc) {
            FinancialAccount::firstOrCreate(
                [
                    'scope_key' => $scopeKey,
                    'code' => $acc['code'],
                ],
                [
                    'equb_group_id' => $group->id,
                    'name' => $acc['name'],
                    'type' => $acc['type'],
                    'subtype' => $acc['subtype'],
                    'currency' => 'ETB',
                    'is_system' => true,
                    'is_active' => true,
                    'created_by' => $actor->id,
                ]
            );
        }
    }

    public function getOrCreateAccount(EqubGroup $group, string $code): FinancialAccount
    {
        $scopeKey = "group:{$group->id}";
        $account = FinancialAccount::where('scope_key', $scopeKey)->where('code', $code)->first();

        if (! $account) {
            $default = collect(self::DEFAULT_ACCOUNTS)->firstWhere('code', $code);
            if ($default) {
                $account = FinancialAccount::create([
                    'scope_key' => $scopeKey,
                    'equb_group_id' => $group->id,
                    'code' => $default['code'],
                    'name' => $default['name'],
                    'type' => $default['type'],
                    'subtype' => $default['subtype'],
                    'currency' => 'ETB',
                    'is_system' => true,
                    'is_active' => true,
                ]);
            } else {
                throw new \InvalidArgumentException("Unknown financial account code: {$code}");
            }
        }

        return $account;
    }

    /**
     * Records a balanced double-entry journal entry.
     *
     * @param  array<int, array{account_id: int, member_profile_id?: int|null, debit: float|string, credit: float|string, memo?: string|null}>  $lines
     */
    public function recordJournalEntry(
        EqubGroup $group,
        ?EqubCycle $cycle,
        string $description,
        string $sourceType,
        ?int $sourceId,
        string $postingKey,
        array $lines,
        User $actor
    ): JournalEntry {
        return DB::transaction(function () use ($group, $cycle, $description, $sourceType, $sourceId, $postingKey, $lines, $actor) {
            // Idempotency check
            $existing = JournalEntry::where('posting_key', $postingKey)->first();
            if ($existing) {
                return $existing;
            }

            // Balanced entry check
            $totalDebit = 0.00;
            $totalCredit = 0.00;

            foreach ($lines as $line) {
                $totalDebit += (float) ($line['debit'] ?? 0);
                $totalCredit += (float) ($line['credit'] ?? 0);
            }

            if (abs($totalDebit - $totalCredit) > 0.001) {
                throw ValidationException::withMessages([
                    'ledger' => ["Unbalanced journal entry: Debits ({$totalDebit}) != Credits ({$totalCredit})."],
                ]);
            }

            $year = date('Y');
            $count = JournalEntry::whereYear('created_at', $year)->count() + 1;
            $entryNumber = sprintf('JRN-%s-%06d', $year, $count);

            $entry = JournalEntry::create([
                'entry_number' => $entryNumber,
                'equb_group_id' => $group->id,
                'equb_cycle_id' => $cycle?->id,
                'entry_date' => now()->toDateString(),
                'description' => $description,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'posting_key' => $postingKey,
                'posted_by' => $actor->id,
                'posted_at' => now(),
                'created_at' => now(),
            ]);

            foreach ($lines as $index => $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'line_number' => $index + 1,
                    'financial_account_id' => $line['account_id'],
                    'member_profile_id' => $line['member_profile_id'] ?? null,
                    'debit' => (string) ($line['debit'] ?? 0.00),
                    'credit' => (string) ($line['credit'] ?? 0.00),
                    'memo' => $line['memo'] ?? null,
                    'created_at' => now(),
                ]);
            }

            $this->auditService->log(
                event: 'ledger.posted',
                auditable: $entry,
                before: [],
                after: ['entry_number' => $entry->entry_number, 'amount' => $totalDebit],
                equbGroupId: $group->id
            );

            return $entry;
        });
    }

    /**
     * Posts a verified initial deposit to the ledger.
     * Debit: Bank/Cash, Credit: 2010 Retained Initial Deposits
     */
    public function postInitialDeposit(Payment $payment, User $actor): JournalEntry
    {
        $group = $payment->group;
        $this->setupChartOfAccounts($group, $actor);

        $assetCode = match ($payment->method?->value ?? $payment->method) {
            'cash' => '1000',
            'mobile_money' => '1020',
            default => '1010',
        };

        $assetAccount = $this->getOrCreateAccount($group, $assetCode);
        $liabilityAccount = $this->getOrCreateAccount($group, '2010'); // Retained Initial Deposits

        $postingKey = "payment:deposit:{$payment->id}:verified";

        return $this->recordJournalEntry(
            group: $group,
            cycle: $payment->cycle,
            description: "Initial Deposit received - Member #{$payment->membership?->membership_number} (Ref: {$payment->reference})",
            sourceType: 'payments',
            sourceId: $payment->id,
            postingKey: $postingKey,
            lines: [
                [
                    'account_id' => $assetAccount->id,
                    'member_profile_id' => $payment->member_profile_id,
                    'debit' => $payment->amount,
                    'credit' => 0.00,
                    'memo' => 'Deposit received into asset account',
                ],
                [
                    'account_id' => $liabilityAccount->id,
                    'member_profile_id' => $payment->member_profile_id,
                    'debit' => 0.00,
                    'credit' => $payment->amount,
                    'memo' => 'Retained initial deposit (distribution policy pending)',
                ],
            ],
            actor: $actor
        );
    }

    /**
     * Posts verified regular contribution to ledger.
     * Debit: Bank/Cash, Credit: 2020 Members' Equb Contributions Pool
     */
    public function postContribution(Payment $payment, User $actor): JournalEntry
    {
        $group = $payment->group;
        $this->setupChartOfAccounts($group, $actor);

        $assetCode = match ($payment->method?->value ?? $payment->method) {
            'cash' => '1000',
            'mobile_money' => '1020',
            default => '1010',
        };

        $assetAccount = $this->getOrCreateAccount($group, $assetCode);
        $liabilityAccount = $this->getOrCreateAccount($group, '2020'); // Equb Contributions Pool

        $postingKey = "payment:contribution:{$payment->id}:verified";

        return $this->recordJournalEntry(
            group: $group,
            cycle: $payment->cycle,
            description: "Regular Contribution received - Member #{$payment->membership?->membership_number} (Ref: {$payment->reference})",
            sourceType: 'payments',
            sourceId: $payment->id,
            postingKey: $postingKey,
            lines: [
                [
                    'account_id' => $assetAccount->id,
                    'member_profile_id' => $payment->member_profile_id,
                    'debit' => $payment->amount,
                    'credit' => 0.00,
                    'memo' => 'Contribution received into asset account',
                ],
                [
                    'account_id' => $liabilityAccount->id,
                    'member_profile_id' => $payment->member_profile_id,
                    'debit' => 0.00,
                    'credit' => $payment->amount,
                    'memo' => "Members' Equb Contributions Pool",
                ],
            ],
            actor: $actor
        );
    }

    /**
     * Posts disbursed payout to ledger.
     * Debit: 2020 Members' Equb Contributions Pool, Credit: Bank/Cash
     */
    public function postPayoutDisbursement(Payout $payout, User $actor): JournalEntry
    {
        $group = $payout->group;
        $this->setupChartOfAccounts($group, $actor);

        $assetCode = match ($payout->method) {
            'cash' => '1000',
            'mobile_money', 'telebirr', 'cbe_birr' => '1020',
            default => '1010',
        };

        $assetAccount = $this->getOrCreateAccount($group, $assetCode);
        $poolAccount = $this->getOrCreateAccount($group, '2020');

        $postingKey = "payout:disbursement:{$payout->id}:disbursed";

        return $this->recordJournalEntry(
            group: $group,
            cycle: $payout->cycle,
            description: "Payout Disbursed - Slot #{$payout->payout_sequence} to {$payout->member_profile?->full_name} (Ref: {$payout->disbursement_reference})",
            sourceType: 'payouts',
            sourceId: $payout->id,
            postingKey: $postingKey,
            lines: [
                [
                    'account_id' => $poolAccount->id,
                    'member_profile_id' => $payout->member_profile_id,
                    'debit' => $payout->amount,
                    'credit' => 0.00,
                    'memo' => 'Disbursement settlement against Equb Pot',
                ],
                [
                    'account_id' => $assetAccount->id,
                    'member_profile_id' => $payout->member_profile_id,
                    'debit' => 0.00,
                    'credit' => $payout->amount,
                    'memo' => 'Disbursement from asset account',
                ],
            ],
            actor: $actor
        );
    }

    /**
     * Generates Trial Balance sheet for the group.
     */
    public function getTrialBalance(EqubGroup $group): array
    {
        $scopeKey = "group:{$group->id}";
        $accounts = FinancialAccount::where('scope_key', $scopeKey)->with('lines')->get();

        $rows = [];
        $totalDebits = 0.00;
        $totalCredits = 0.00;

        foreach ($accounts as $acc) {
            $debitSum = (float) $acc->lines->sum('debit');
            $creditSum = (float) $acc->lines->sum('credit');

            $totalDebits += $debitSum;
            $totalCredits += $creditSum;

            $rows[] = [
                'account_id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'type' => $acc->type->value,
                'debit' => number_format($debitSum, 2, '.', ''),
                'credit' => number_format($creditSum, 2, '.', ''),
                'balance' => number_format($acc->currentBalance(), 2, '.', ''),
            ];
        }

        $difference = abs($totalDebits - $totalCredits);

        return [
            'rows' => $rows,
            'total_debits' => number_format($totalDebits, 2, '.', ''),
            'total_credits' => number_format($totalCredits, 2, '.', ''),
            'is_balanced' => $difference < 0.001,
            'difference' => number_format($difference, 2, '.', ''),
        ];
    }

    /**
     * Returns all General Ledger journal entries for the group.
     */
    public function getGeneralLedger(EqubGroup $group): Collection
    {
        return JournalEntry::where('equb_group_id', $group->id)
            ->with(['lines.account', 'lines.memberProfile', 'poster'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->get();
    }
}
