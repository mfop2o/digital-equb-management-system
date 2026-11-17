import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import React, { useState } from 'react';
import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import type {
    ContributionPeriod,
    EqubGroup,
    MemberStatusBoard,
} from '@/types/equb';

interface Props {
    group: EqubGroup;
    statusBoard: MemberStatusBoard;
    periods: ContributionPeriod[];
}

export default function MemberStatusBoardPage({
    group,
    statusBoard,
    periods: _periods,
}: Props) {
    const { t } = useTranslation();
    const [filterColor, setFilterColor] = useState<
        'all' | 'green' | 'red' | 'blue' | 'neutral'
    >('all');

    const filteredMembers = statusBoard.members.filter((m) => {
        if (filterColor === 'all') return true;
        return m.color === filterColor;
    });

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('contributions.title'),
                href: `/groups/${group.id}/contributions`,
            },
            {
                title: t('contributions.statusBoard'),
                href: `/groups/${group.id}/contributions/status-board`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('contributions.statusBoard')} — ${group.name}`} />

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('contributions.statusBoardTitle')}
                    description={t('contributions.statusBoardDesc', {
                        group: group.name,
                    })}
                    actions={
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {t('common.all')}: {statusBoard.total_active}
                            </Badge>
                            <Link href={`/groups/${group.id}/contributions`}>
                                <Button variant="outline" size="sm">
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    {t('contributions.backToContributions')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* 4 Main Color KPI Cards */}
                <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div
                        onClick={() =>
                            setFilterColor(
                                filterColor === 'green' ? 'all' : 'green',
                            )
                        }
                        className={`cursor-pointer rounded-xl border p-5 transition-all ${
                            filterColor === 'green'
                                ? 'bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950/40'
                                : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                                🟩 GREEN
                            </span>
                            <Badge className="bg-emerald-600 text-[10px] text-white">
                                {t('contributions.eligible')}
                            </Badge>
                        </div>
                        <div className="mt-3 text-3xl font-extrabold text-emerald-700 dark:text-emerald-100">
                            {statusBoard.green}
                        </div>
                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                            {t('contributions.greenDesc')}
                        </p>
                    </div>

                    <div
                        onClick={() =>
                            setFilterColor(
                                filterColor === 'red' ? 'all' : 'red',
                            )
                        }
                        className={`cursor-pointer rounded-xl border p-5 transition-all ${
                            filterColor === 'red'
                                ? 'bg-rose-50 ring-2 ring-rose-500 dark:bg-rose-950/40'
                                : 'border-rose-200 bg-rose-50/50 hover:border-rose-300 dark:border-rose-900 dark:bg-rose-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                                🟥 RED
                            </span>
                            <Badge className="bg-rose-600 text-[10px] text-white">
                                {t('contributions.ineligible')}
                            </Badge>
                        </div>
                        <div className="mt-3 text-3xl font-extrabold text-rose-700 dark:text-rose-100">
                            {statusBoard.red}
                        </div>
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                            {t('contributions.redDesc')}
                        </p>
                    </div>

                    <div
                        onClick={() =>
                            setFilterColor(
                                filterColor === 'blue' ? 'all' : 'blue',
                            )
                        }
                        className={`cursor-pointer rounded-xl border p-5 transition-all ${
                            filterColor === 'blue'
                                ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950/40'
                                : 'border-blue-200 bg-blue-50/50 hover:border-blue-300 dark:border-blue-900 dark:bg-blue-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                🟦 BLUE
                            </span>
                            <Badge className="bg-blue-600 text-[10px] text-white">
                                {t('contributions.recipient')}
                            </Badge>
                        </div>
                        <div className="mt-3 text-3xl font-extrabold text-blue-700 dark:text-blue-100">
                            {statusBoard.blue}
                        </div>
                        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                            {t('contributions.blueDesc')}
                        </p>
                    </div>

                    <div
                        onClick={() =>
                            setFilterColor(
                                filterColor === 'neutral' ? 'all' : 'neutral',
                            )
                        }
                        className={`cursor-pointer rounded-xl border p-5 transition-all ${
                            filterColor === 'neutral'
                                ? 'bg-slate-100 ring-2 ring-slate-400 dark:bg-slate-800/60'
                                : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                ⬜ N/A
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                                {t('contributions.neutral')}
                            </Badge>
                        </div>
                        <div className="mt-3 text-3xl font-extrabold text-slate-600 dark:text-slate-300">
                            {statusBoard.neutral ?? 0}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('contributions.neutralDesc')}
                        </p>
                    </div>
                </div>

                {/* Overdue Alert banner if any */}
                {statusBoard.overdue > 0 && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div className="text-sm">
                            <p className="font-semibold text-amber-900 dark:text-amber-200">
                                {t('contributions.overdueWarning')} (
                                {statusBoard.overdue})
                            </p>
                            <p className="text-amber-800 dark:text-amber-300">
                                {t('contributions.statusOverdue')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Member Grid */}
                <Card className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base">
                                {t('contributions.enrolledMembers')}
                            </CardTitle>
                            <CardDescription>
                                {filteredMembers.length} {t('common.details')}{' '}
                                {filterColor !== 'all'
                                    ? `(${filterColor.toUpperCase()})`
                                    : ''}
                            </CardDescription>
                        </div>
                        {filterColor !== 'all' && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setFilterColor('all')}
                                className="text-xs"
                            >
                                {t('contributions.clearFilter')}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3">
                                            {t('common.status')}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t('members.fullName')}
                                        </th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">
                                            {t('common.status')}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t('contributions.overdueWarning')}
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredMembers.map((member) => (
                                        <tr
                                            key={member.membership_id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`h-3.5 w-3.5 rounded-full ${
                                                            member.color ===
                                                            'green'
                                                                ? 'bg-emerald-500 ring-2 ring-emerald-200'
                                                                : member.color ===
                                                                    'red'
                                                                  ? 'bg-rose-500 ring-2 ring-rose-200'
                                                                  : member.color ===
                                                                      'blue'
                                                                    ? 'bg-blue-500 ring-2 ring-blue-200'
                                                                    : 'bg-slate-400 ring-2 ring-slate-200'
                                                        }`}
                                                    />
                                                    <span className="text-xs font-semibold uppercase">
                                                        {member.color}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                <div>{member.full_name}</div>
                                                <div className="font-mono text-xs text-muted-foreground">
                                                    {member.membership_number}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs capitalize">
                                                {member.role}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {member.label}
                                            </td>
                                            <td className="px-4 py-3">
                                                {member.is_overdue ? (
                                                    <Badge
                                                        variant="destructive"
                                                        className="text-xs"
                                                    >
                                                        ⚠{' '}
                                                        {t(
                                                            'contributions.overdue',
                                                        ).toUpperCase()}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/members/${member.member_profile_id}`}
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs"
                                                    >
                                                        {t(
                                                            'contributions.profile',
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
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}
