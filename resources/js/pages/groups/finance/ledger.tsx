import { Head, setLayoutProps } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Layers,
    Scale,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { GroupNavigation } from '@/components/group-navigation';
import { formatEtb } from '@/components/money';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { SummaryCard } from '@/components/summary-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import type { EqubGroup } from '@/types/equb';

interface LedgerLine {
    id: number;
    line_number: number;
    debit: string;
    credit: string;
    memo: string;
    account?: { code: string; name: string };
}

interface LedgerEntry {
    id: number;
    entry_number: string;
    entry_date: string;
    description: string;
    source_type: string;
    is_balanced: boolean;
    lines: LedgerLine[];
}

interface Props {
    group: EqubGroup;
    ledger: LedgerEntry[];
}

export default function FinanceLedger({ group, ledger }: Props) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggle = (id: number) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const sourceLabel = (type: string) =>
        type
            .split('\\')
            .pop()
            ?.replace(/([A-Z])/g, ' $1')
            .trim() ?? type;

    const totalDebits = ledger.reduce(
        (sum, entry) =>
            sum +
            entry.lines.reduce(
                (lineSum, line) => lineSum + Number(line.debit || 0),
                0,
            ),
        0,
    );
    const totalCredits = ledger.reduce(
        (sum, entry) =>
            sum +
            entry.lines.reduce(
                (lineSum, line) => lineSum + Number(line.credit || 0),
                0,
            ),
        0,
    );
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.005;

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('finance.title'),
                href: `/groups/${group.id}/finance`,
            },
            {
                title: t('finance.generalLedger'),
                href: `/groups/${group.id}/finance/ledger`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('finance.generalLedger')} — ${group.name}`} />
            <PageContainer size="wide">
                <PageHeader
                    eyebrow="Finance"
                    title={t('finance.generalLedger')}
                    description={t('finance.ledgerDescription', {
                        group: group.name,
                        count: ledger.length,
                    })}
                    icon={Layers}
                    backHref={`/groups/${group.id}/finance`}
                    backLabel="Finance overview"
                    actions={
                        <Button
                            variant="outline"
                            onClick={() =>
                                setExpanded(
                                    expanded.size === 0
                                        ? new Set(
                                              ledger.map((entry) => entry.id),
                                          )
                                        : new Set(),
                                )
                            }
                        >
                            {expanded.size === 0
                                ? t('finance.expandAll')
                                : t('finance.collapseAll')}
                        </Button>
                    }
                />

                <GroupNavigation groupId={group.id} />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label={t('finance.totalEntries')}
                        value={ledger.length}
                        hint="Journal entries"
                        icon={Layers}
                    />
                    <SummaryCard
                        label={t('finance.totalDebits')}
                        value={formatEtb(totalDebits)}
                        hint="All debits"
                        icon={TrendingUp}
                        tone="emerald"
                    />
                    <SummaryCard
                        label={t('finance.totalCredits')}
                        value={formatEtb(totalCredits)}
                        hint="All credits"
                        icon={TrendingDown}
                        tone="blue"
                    />
                    <SummaryCard
                        label="Trial balance"
                        value={isBalanced ? 'Balanced' : 'Unbalanced'}
                        hint={
                            isBalanced
                                ? 'Debits equal credits'
                                : `Difference ${formatEtb(Math.abs(totalDebits - totalCredits))}`
                        }
                        icon={Scale}
                        tone={isBalanced ? 'emerald' : 'red'}
                    />
                </div>

                <div className="space-y-3">
                    {ledger.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                {t('finance.noEntries')}
                            </CardContent>
                        </Card>
                    ) : (
                        ledger.map((entry) => {
                            const isOpen = expanded.has(entry.id);
                            const entryDebit = entry.lines.reduce(
                                (sum, line) => sum + Number(line.debit || 0),
                                0,
                            );
                            const entryCredit = entry.lines.reduce(
                                (sum, line) => sum + Number(line.credit || 0),
                                0,
                            );

                            return (
                                <Card key={entry.id} className="gap-0 py-0">
                                    <button
                                        type="button"
                                        onClick={() => toggle(entry.id)}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 sm:px-5"
                                    >
                                        {isOpen ? (
                                            <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {entry.entry_number}
                                                </span>
                                                <StatusBadge
                                                    status={
                                                        entry.is_balanced
                                                            ? 'verified'
                                                            : 'rejected'
                                                    }
                                                    label={
                                                        entry.is_balanced
                                                            ? t(
                                                                  'finance.isBalanced',
                                                              )
                                                            : t(
                                                                  'finance.unbalanced',
                                                              )
                                                    }
                                                />
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground capitalize">
                                                    {sourceLabel(
                                                        entry.source_type,
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-sm font-medium">
                                                {entry.description}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    entry.entry_date,
                                                ).toLocaleDateString()}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums">
                                                {formatEtb(entryDebit)}
                                            </p>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="border-t px-4 py-3 sm:px-5">
                                            <DataTable
                                                rows={entry.lines}
                                                getRowKey={(line) => line.id}
                                                columns={[
                                                    {
                                                        key: 'line',
                                                        header: '#',
                                                        mobileLabel: 'Line',
                                                        hideOnMobile: true,
                                                        render: (line) => (
                                                            <span className="text-xs text-muted-foreground">
                                                                {
                                                                    line.line_number
                                                                }
                                                            </span>
                                                        ),
                                                    },
                                                    {
                                                        key: 'account',
                                                        header: t(
                                                            'finance.account',
                                                        ),
                                                        mobileLabel:
                                                            t(
                                                                'finance.account',
                                                            ),
                                                        render: (line) => (
                                                            <div>
                                                                <p className="font-mono text-xs text-muted-foreground">
                                                                    {
                                                                        line
                                                                            .account
                                                                            ?.code
                                                                    }
                                                                </p>
                                                                <p className="text-sm">
                                                                    {line
                                                                        .account
                                                                        ?.name ??
                                                                        '—'}
                                                                </p>
                                                            </div>
                                                        ),
                                                    },
                                                    {
                                                        key: 'memo',
                                                        header: t(
                                                            'finance.memo',
                                                        ),
                                                        mobileLabel:
                                                            t('finance.memo'),
                                                        render: (line) => (
                                                            <span className="text-xs text-muted-foreground">
                                                                {line.memo ||
                                                                    '—'}
                                                            </span>
                                                        ),
                                                    },
                                                    {
                                                        key: 'debit',
                                                        header: t(
                                                            'finance.debit',
                                                        ),
                                                        mobileLabel:
                                                            t('finance.debit'),
                                                        render: (line) => (
                                                            <span className="font-mono text-xs tabular-nums">
                                                                {Number(
                                                                    line.debit,
                                                                ) > 0
                                                                    ? formatEtb(
                                                                          line.debit,
                                                                      )
                                                                    : '—'}
                                                            </span>
                                                        ),
                                                    },
                                                    {
                                                        key: 'credit',
                                                        header: t(
                                                            'finance.credit',
                                                        ),
                                                        mobileLabel:
                                                            t('finance.credit'),
                                                        render: (line) => (
                                                            <span className="font-mono text-xs tabular-nums">
                                                                {Number(
                                                                    line.credit,
                                                                ) > 0
                                                                    ? formatEtb(
                                                                          line.credit,
                                                                      )
                                                                    : '—'}
                                                            </span>
                                                        ),
                                                    },
                                                ]}
                                            />
                                            <div className="mt-2 flex flex-wrap items-center justify-end gap-4 text-xs text-muted-foreground">
                                                <span>
                                                    {t('finance.totalDebits')}:{' '}
                                                    <span className="font-mono font-semibold tabular-nums">
                                                        {formatEtb(entryDebit)}
                                                    </span>
                                                </span>
                                                <span>
                                                    {t('finance.totalCredits')}:{' '}
                                                    <span className="font-mono font-semibold tabular-nums">
                                                        {formatEtb(entryCredit)}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>
            </PageContainer>
        </>
    );
}
