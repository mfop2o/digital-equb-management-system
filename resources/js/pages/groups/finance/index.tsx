import { Head, router, setLayoutProps } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    CheckCircle,
    DollarSign,
    Scale,
    TrendingUp,
} from 'lucide-react';

import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { useTranslation } from '@/hooks/use-translation';
import { EqubGroup } from '@/types/equb';

interface TrialBalanceRow {
    code: string;
    name: string;
    type: string;
    debit: string;
    credit: string;
}

interface TrialBalance {
    rows: TrialBalanceRow[];
    total_debits: string;
    total_credits: string;
    is_balanced: boolean;
    difference: string;
}

interface JournalEntryLine {
    id: number;
    line_number: number;
    debit: string;
    credit: string;
    memo: string;
    account?: { code: string; name: string };
}

interface JournalEntry {
    id: number;
    entry_number: string;
    entry_date: string;
    description: string;
    source_type: string;
    is_balanced: boolean;
    lines?: JournalEntryLine[];
}

interface Props {
    group: EqubGroup;
    trialBalance: TrialBalance;
    recentEntries: JournalEntry[];
}

export default function FinanceIndex({
    group,
    trialBalance,
    recentEntries,
}: Props) {
    const { t } = useTranslation();

    const totalAssets = trialBalance.rows
        .filter((r) => r.type === 'asset')
        .reduce(
            (sum, r) =>
                sum + parseFloat(r.debit || '0') - parseFloat(r.credit || '0'),
            0,
        );

    const totalLiabilities = trialBalance.rows
        .filter((r) => r.type === 'liability')
        .reduce(
            (sum, r) =>
                sum + parseFloat(r.credit || '0') - parseFloat(r.debit || '0'),
            0,
        );

    const formatMoney = (val: string | number) =>
        new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
        }).format(Number(val));

    const sourceLabel = (type: string) =>
        type
            .split('\\')
            .pop()
            ?.replace(/([A-Z])/g, ' $1')
            .trim() ?? type;

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('finance.title'),
                href: `/groups/${group.id}/finance`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('finance.title')} — ${group.name}`} />
            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('finance.title')}
                    description={t('finance.subtitle')}
                    actions={
                        <button
                            onClick={() =>
                                router.visit(
                                    `/groups/${group.id}/finance/ledger`,
                                )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <BookOpen className="h-4 w-4" />
                            {t('finance.generalLedger')}
                        </button>
                    }
                />

                {/* Summary Cards */}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        label={t('finance.totalAssets')}
                        value={formatMoney(totalAssets)}
                        icon={DollarSign}
                        hint="Bank + Cash balances"
                    />
                    <SummaryCard
                        label={t('finance.totalLiabilities')}
                        value={formatMoney(totalLiabilities)}
                        icon={Scale}
                        hint="Funds owed to members"
                    />
                    <SummaryCard
                        label={t('finance.totalDebits')}
                        value={formatMoney(trialBalance.total_debits)}
                        icon={TrendingUp}
                        hint="Sum of all debit entries"
                    />
                    <SummaryCard
                        label={t('common.status')}
                        value={
                            trialBalance.is_balanced
                                ? t('finance.isBalanced')
                                : t('finance.unbalanced')
                        }
                        icon={
                            trialBalance.is_balanced
                                ? CheckCircle
                                : AlertTriangle
                        }
                        hint={
                            trialBalance.is_balanced
                                ? 'Debits = Credits'
                                : `${t('finance.difference')}: ${formatMoney(trialBalance.difference)}`
                        }
                    />
                </div>

                {/* Trial Balance Table */}
                <div className="w-full rounded-2xl border border-border/70 bg-card shadow-xs">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-base font-semibold">
                            {t('finance.trialBalance')}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {t('finance.subtitle')}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    <th className="px-6 py-3">
                                        {t('finance.accountCode')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('finance.accountName')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('finance.accountType')}
                                    </th>
                                    <th className="px-6 py-3 text-right">
                                        {t('finance.debit')} (ETB)
                                    </th>
                                    <th className="px-6 py-3 text-right">
                                        {t('finance.credit')} (ETB)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {trialBalance.rows.map((row) => (
                                    <tr
                                        key={row.code}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                                            {row.code}
                                        </td>
                                        <td className="px-6 py-3 font-medium">
                                            {row.name}
                                        </td>
                                        <td className="px-6 py-3 capitalize">
                                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right tabular-nums">
                                            {parseFloat(row.debit) > 0
                                                ? formatMoney(row.debit)
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-3 text-right tabular-nums">
                                            {parseFloat(row.credit) > 0
                                                ? formatMoney(row.credit)
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 bg-muted/50 font-semibold">
                                    <td
                                        colSpan={3}
                                        className="px-6 py-3 text-sm"
                                    >
                                        {t('common.all').toUpperCase()}
                                    </td>
                                    <td className="px-6 py-3 text-right tabular-nums">
                                        {formatMoney(trialBalance.total_debits)}
                                    </td>
                                    <td className="px-6 py-3 text-right tabular-nums">
                                        {formatMoney(
                                            trialBalance.total_credits,
                                        )}
                                    </td>
                                </tr>
                                {!trialBalance.is_balanced && (
                                    <tr className="bg-destructive/10 text-destructive">
                                        <td
                                            colSpan={3}
                                            className="px-6 py-2 text-xs font-medium"
                                        >
                                            ⚠ {t('finance.unbalanced')}
                                        </td>
                                        <td
                                            colSpan={2}
                                            className="px-6 py-2 text-right text-xs font-medium"
                                        >
                                            {t('finance.difference')}:{' '}
                                            {formatMoney(
                                                trialBalance.difference,
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Recent Journal Entries */}
                <div className="w-full rounded-2xl border border-border/70 bg-card shadow-xs">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-base font-semibold">
                            {t('finance.recentEntries')}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {t('finance.subtitle')}
                        </p>
                    </div>
                    <div className="divide-y">
                        {recentEntries.length === 0 ? (
                            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                                {t('finance.noEntries')}
                            </div>
                        ) : (
                            recentEntries.map((entry) => (
                                <div key={entry.id} className="px-6 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {entry.entry_number}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        entry.is_balanced
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {entry.is_balanced
                                                        ? t(
                                                              'finance.isBalanced',
                                                          )
                                                        : t(
                                                              'finance.unbalanced',
                                                          )}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-sm font-medium">
                                                {entry.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {sourceLabel(entry.source_type)}{' '}
                                                •{' '}
                                                {new Date(
                                                    entry.entry_date,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {entry.lines && entry.lines.length > 0 && (
                                        <div className="mt-3 overflow-x-auto rounded-lg bg-muted/30 text-xs">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-muted-foreground">
                                                        <th className="px-3 py-2 text-left">
                                                            {t(
                                                                'finance.account',
                                                            )}
                                                        </th>
                                                        <th className="px-3 py-2 text-right">
                                                            {t('finance.debit')}
                                                        </th>
                                                        <th className="px-3 py-2 text-right">
                                                            {t(
                                                                'finance.credit',
                                                            )}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-muted">
                                                    {entry.lines.map((line) => (
                                                        <tr key={line.id}>
                                                            <td className="px-3 py-1.5">
                                                                {line.account
                                                                    ? `${line.account.code} ${line.account.name}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-right tabular-nums">
                                                                {parseFloat(
                                                                    line.debit,
                                                                ) > 0
                                                                    ? formatMoney(
                                                                          line.debit,
                                                                      )
                                                                    : ''}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-right tabular-nums">
                                                                {parseFloat(
                                                                    line.credit,
                                                                ) > 0
                                                                    ? formatMoney(
                                                                          line.credit,
                                                                      )
                                                                    : ''}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </PageContainer>
        </>
    );
}
