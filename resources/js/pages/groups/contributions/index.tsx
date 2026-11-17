import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    Award,
    Calendar,
    CircleCheckBig,
    CircleX,
    Play,
    Shield,
    TriangleAlert,
} from 'lucide-react';
import React from 'react';
import { DataTable } from '@/components/data-table';
import { GroupNavigation } from '@/components/group-navigation';
import { formatEtb } from '@/components/money';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { SummaryCard } from '@/components/summary-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import type {
    ContributionPeriod,
    EqubGroup,
    MemberStatusBoard,
} from '@/types/equb';

interface Props {
    group: EqubGroup;
    periods: ContributionPeriod[];
    statusBoard: MemberStatusBoard;
}

export default function ContributionsIndex({
    group,
    periods,
    statusBoard,
}: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();

    const handleGeneratePeriods = () => {
        router.post(`/groups/${group.id}/contributions/generate`);
    };

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('contributions.title'),
                href: `/groups/${group.id}/contributions`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('contributions.title')} — ${group.name}`} />

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('contributions.title')}
                    description={t('contributions.subtitle')}
                    actions={
                        <div className="flex gap-2">
                            <Link
                                href={`/groups/${group.id}/contributions/status-board`}
                            >
                                <Button variant="outline" size="sm">
                                    <Shield className="mr-1.5 h-4 w-4 text-emerald-600" />
                                    {t('contributions.statusBoard')}
                                </Button>
                            </Link>
                            {periods.length === 0 &&
                                can('contributions.generate') && (
                                    <Button
                                        onClick={handleGeneratePeriods}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        size="sm"
                                    >
                                        <Play className="mr-1.5 h-4 w-4" />
                                        {t('contributions.generatePeriods')}
                                    </Button>
                                )}
                        </div>
                    }
                />

                {/* Member Status Overview Cards */}
                <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="group rounded-2xl border border-border/70 bg-card p-5 text-card-foreground shadow-xs transition-all duration-200 hover:shadow-md hover:border-emerald-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                {t('contributions.greenStatus')}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-600" />
                                {t('contributions.eligible')}
                            </span>
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl tabular-nums">
                            {statusBoard.green}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('contributions.greenDesc')}
                        </p>
                    </div>

                    <div className="group rounded-2xl border border-border/70 bg-card p-5 text-card-foreground shadow-xs transition-all duration-200 hover:shadow-md hover:border-rose-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                {t('contributions.redStatus')}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                                <span className="size-1.5 rounded-full bg-rose-600" />
                                {t('contributions.ineligible')}
                            </span>
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl tabular-nums">
                            {statusBoard.red}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('contributions.redDesc')}
                        </p>
                    </div>

                    <div className="group rounded-2xl border border-border/70 bg-card p-5 text-card-foreground shadow-xs transition-all duration-200 hover:shadow-md hover:border-blue-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                {t('contributions.blueStatus')}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-400">
                                <span className="size-1.5 rounded-full bg-blue-600" />
                                {t('contributions.recipient')}
                            </span>
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl tabular-nums">
                            {statusBoard.blue}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('contributions.blueDesc')}
                        </p>
                    </div>

                    <div className="group rounded-2xl border border-border/70 bg-card p-5 text-card-foreground shadow-xs transition-all duration-200 hover:shadow-md hover:border-amber-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                {t('contributions.overdueWarning')}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                                <span className="size-1.5 rounded-full bg-amber-600" />
                                {t('contributions.overdue')}
                            </span>
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl tabular-nums">
                            {statusBoard.overdue}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('contributions.statusOverdue')}
                        </p>
                    </div>
                </div>

                {/* Periods Table */}
                <Card className="w-full rounded-2xl border border-border/70 shadow-xs">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                            <span>
                                {t('contributions.periodNumber')} (
                                {periods.length})
                            </span>
                            <span className="text-xs font-normal text-muted-foreground">
                                {t('common.amount')}:{' '}
                                {Number(
                                    group.active_rule?.contribution_amount ?? 0,
                                ).toLocaleString()}{' '}
                                ETB &bull;{' '}
                                {group.active_rule?.contribution_frequency}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {periods.length === 0 ? (
                            <div className="p-8 text-center">
                                <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                                <p className="font-semibold">
                                    {t('common.empty')}
                                </p>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    {t('contributions.subtitle')}
                                </p>
                                {can('contributions.generate') && (
                                    <Button
                                        onClick={handleGeneratePeriods}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <Play className="mr-1.5 h-4 w-4" />
                                        {t('contributions.generatePeriods')}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-4 py-3">#</th>
                                            <th className="px-4 py-3">
                                                {t(
                                                    'contributions.periodNumber',
                                                )}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('common.amount')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('contributions.dueDate')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('common.status')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('deposits.verifiedMembers')}
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                {t('common.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {periods.map((period) => (
                                            <tr
                                                key={period.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {period.sequence}
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {period.label}
                                                </td>
                                                <td className="px-4 py-3 font-mono">
                                                    {Number(
                                                        period.amount_due_snapshot,
                                                    ).toLocaleString()}{' '}
                                                    ETB
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {period.due_on}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            period.status ===
                                                            'open'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {period.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {period.verified_count ?? 0}{' '}
                                                    /{' '}
                                                    {period.total_obligations_count ??
                                                        0}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/groups/${group.id}/contributions/periods/${period.id}`}
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs"
                                                        >
                                                            {t(
                                                                'deposits.viewObligations',
                                                            )}{' '}
                                                            &rarr;
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}
