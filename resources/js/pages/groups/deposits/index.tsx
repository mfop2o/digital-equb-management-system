import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    DollarSign,
    Layers,
    Play,
    ShieldCheck,
} from 'lucide-react';
import React from 'react';
import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import type { DepositRound, EqubCycle, EqubGroup } from '@/types/equb';

interface Props {
    group: EqubGroup;
    cycle: EqubCycle | null;
    rounds: DepositRound[];
    accumulated: {
        total_expected: string;
        total_verified: string;
        total_pending: string;
        retained_deposits: string;
        rounds_count: number;
    };
}

export default function DepositsIndex({
    group,
    cycle,
    rounds,
    accumulated,
}: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();

    const handleCreateCycle = () => {
        router.post(`/groups/${group.id}/deposits/cycle`);
    };

    const handleOpenRound = (roundId: number) => {
        router.post(`/groups/${group.id}/deposits/rounds/${roundId}/open`);
    };

    const handleCloseRound = (roundId: number) => {
        router.post(`/groups/${group.id}/deposits/rounds/${roundId}/close`);
    };

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('deposits.title'),
                href: `/groups/${group.id}/deposits`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('deposits.title')} — ${group.name}`} />

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('deposits.management')}
                    description={t('deposits.description', {
                        group: group.name,
                        code: group.group_code,
                    })}
                    actions={
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {t('deposits.round')} #
                                {cycle?.cycle_number ?? 1} &bull;{' '}
                                {cycle?.status?.replace('_', ' ') ?? 'Draft'}
                            </Badge>
                            {!cycle && (
                                <Button
                                    onClick={handleCreateCycle}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    size="sm"
                                >
                                    <Play className="mr-1.5 h-4 w-4" />
                                    {t('deposits.initializeStage')}
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Retained Deposits Banner */}
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <div className="text-sm">
                        <p className="font-semibold text-emerald-950 dark:text-emerald-100">
                            {t('deposits.retainedNoticeTitle')}
                        </p>
                        <p className="text-xs text-emerald-800/90 dark:text-emerald-300">
                            {t('deposits.retainedNoticeText')}
                        </p>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard
                        label={t('deposits.retainedDeposits')}
                        value={`${Number(accumulated.retained_deposits).toLocaleString()} ETB`}
                        hint={t('deposits.retainedDepositsHint')}
                        icon={ShieldCheck}
                    />
                    <SummaryCard
                        label={t('deposits.totalExpected')}
                        value={`${Number(accumulated.total_expected).toLocaleString()} ETB`}
                        hint={t('deposits.totalExpectedHint')}
                        icon={DollarSign}
                    />
                    <SummaryCard
                        label={t('deposits.totalVerified')}
                        value={`${Number(accumulated.total_verified).toLocaleString()} ETB`}
                        hint={t('deposits.totalVerifiedHint')}
                        icon={CheckCircle2}
                    />
                    <SummaryCard
                        label={t('deposits.pendingVerification')}
                        value={`${Number(accumulated.total_pending).toLocaleString()} ETB`}
                        hint={t('deposits.pendingVerificationHint')}
                        icon={Clock}
                    />
                </div>

                {/* Deposit Rounds List */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Layers className="h-5 w-5 text-primary" />
                        {t('deposits.configuredRounds')} ({rounds.length})
                    </h3>

                    {rounds.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                <Layers className="mb-3 h-10 w-10 text-muted-foreground" />
                                <p className="font-semibold">
                                    {t('deposits.noRoundsInitialized')}
                                </p>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    {t('deposits.noRoundsDesc')}
                                </p>
                                <Button
                                    onClick={handleCreateCycle}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    <Play className="mr-1.5 h-4 w-4" />
                                    {t('deposits.initializeStage')}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {rounds.map((round) => {
                                const verifiedCount =
                                    round.obligations?.filter(
                                        (o) => o.status === 'verified',
                                    ).length ?? 0;
                                const exemptCount =
                                    round.obligations?.filter(
                                        (o) => o.is_exempt,
                                    ).length ?? 0;
                                const totalObligations =
                                    round.obligations?.length ?? 0;

                                return (
                                    <Card
                                        key={round.id}
                                        className="relative overflow-hidden rounded-2xl border border-border/70 shadow-xs transition-all hover:shadow-md hover:border-emerald-500/30"
                                    >
                                        <div
                                            className={`h-1.5 w-full ${
                                                round.status === 'closed'
                                                    ? 'bg-emerald-500'
                                                    : round.status === 'open'
                                                      ? 'bg-blue-500'
                                                      : 'bg-muted'
                                            }`}
                                        />
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <Badge
                                                    variant={
                                                        round.status ===
                                                        'closed'
                                                            ? 'default'
                                                            : round.status ===
                                                                'open'
                                                              ? 'secondary'
                                                              : 'outline'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {round.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {t('deposits.round')} #
                                                    {round.sequence}
                                                </span>
                                            </div>
                                            <CardTitle className="text-base">
                                                {round.label}
                                            </CardTitle>
                                            <CardDescription>
                                                {t('common.amount')}:{' '}
                                                <span className="font-semibold text-foreground">
                                                    {Number(
                                                        round.amount_per_member,
                                                    ).toLocaleString()}{' '}
                                                    ETB
                                                </span>{' '}
                                                {t('deposits.perPayingMember')}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-3 pb-3 text-sm">
                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                <div className="flex justify-between">
                                                    <span>
                                                        {t('deposits.opens')}:{' '}
                                                        {round.opens_on}
                                                    </span>
                                                    <span>
                                                        {t('deposits.due')}:{' '}
                                                        {round.due_on}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>
                                                        {t(
                                                            'deposits.verifiedMembers',
                                                        )}
                                                        :
                                                    </span>
                                                    <span className="font-semibold text-foreground">
                                                        {verifiedCount} /{' '}
                                                        {Math.max(
                                                            0,
                                                            totalObligations -
                                                                exemptCount,
                                                        )}
                                                    </span>
                                                </div>
                                                {exemptCount > 0 && (
                                                    <div className="flex justify-between text-muted-foreground">
                                                        <span>
                                                            {t(
                                                                'deposits.exemptObligations',
                                                            )}
                                                            :
                                                        </span>
                                                        <span>
                                                            {exemptCount}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-2 border-t pt-3">
                                                <Link
                                                    href={`/groups/${group.id}/deposits/rounds/${round.id}`}
                                                    className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                                                >
                                                    {t(
                                                        'deposits.viewObligations',
                                                    )}{' '}
                                                    &rarr;
                                                </Link>

                                                {round.status === 'pending' &&
                                                    can(
                                                        'deposits.generate',
                                                    ) && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleOpenRound(
                                                                    round.id,
                                                                )
                                                            }
                                                            className="h-8 bg-blue-600 text-xs text-white hover:bg-blue-700"
                                                        >
                                                            {t(
                                                                'deposits.openRound',
                                                            )}
                                                        </Button>
                                                    )}

                                                {round.status === 'open' &&
                                                    can(
                                                        'deposits.approve_stage',
                                                    ) && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleCloseRound(
                                                                    round.id,
                                                                )
                                                            }
                                                            className="h-8 border-emerald-600 text-xs text-emerald-600 hover:bg-emerald-50"
                                                        >
                                                            {t(
                                                                'deposits.closeRound',
                                                            )}
                                                        </Button>
                                                    )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PageContainer>
        </>
    );
}
