import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    ArrowUpRight,
    CheckCircle2,
    Clock,
    DollarSign,
    Play,
    ShieldAlert,
    ShieldCheck,
    Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import { DisbursePayoutModal } from '@/components/disburse-payout-modal';
import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import type { EqubGroup, Payout } from '@/types/equb';

interface Props {
    group: EqubGroup;
    payouts: Payout[];
    canCommence: boolean;
    commencementBlockedReasons: string[];
    currentUserId: number;
}

export default function PayoutsIndex({
    group,
    payouts,
    canCommence,
    commencementBlockedReasons,
    currentUserId,
}: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();
    const [disbursingPayout, setDisbursingPayout] = useState<Payout | null>(
        null,
    );

    const handleScheduleRotation = () => {
        router.post(`/groups/${group.id}/payouts/schedule`);
    };

    const handleRequestApproval = (payoutId: number) => {
        router.post(`/groups/${group.id}/payouts/${payoutId}/request-approval`);
    };

    const handleApprove = (payoutId: number) => {
        router.post(`/groups/${group.id}/payouts/${payoutId}/approve`);
    };

    const handleComplete = (payoutId: number) => {
        router.post(`/groups/${group.id}/payouts/${payoutId}/complete`);
    };

    // Business rule: PAID = disbursed OR completed (not merely approved)
    const paidCount = payouts.filter(
        (p) => p.status === 'disbursed' || p.status === 'completed',
    ).length;
    const approvedCount = payouts.filter((p) => p.status === 'approved').length;
    const pendingApprovalCount = payouts.filter(
        (p) => p.status === 'pending_approval',
    ).length;
    const potAmount = payouts[0]?.amount ?? '0.00';

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('payouts.title'),
                href: `/groups/${group.id}/payouts`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('payouts.title')} — ${group.name}`} />

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('payouts.rotationDisbursement')}
                    description={t('payouts.subtitle')}
                    actions={
                        payouts.length === 0 &&
                        canCommence &&
                        can('payouts.schedule') ? (
                            <Button
                                onClick={handleScheduleRotation}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                size="sm"
                            >
                                <Play className="mr-1.5 h-4 w-4" />
                                {t('payouts.generateSchedule')}
                            </Button>
                        ) : undefined
                    }
                />

                {/* Commencement Gates Banner */}
                {!canCommence ? (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                        <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-rose-900 dark:text-rose-200">
                            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
                            {t('payouts.commenceBlockedTitle')}
                        </div>
                        <ul className="list-inside list-disc space-y-1 text-xs text-rose-800 dark:text-rose-300">
                            {commencementBlockedReasons.map((r, i) => (
                                <li key={i}>{r}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                            {t('payouts.commencementCheck')}
                        </div>
                        {payouts.length === 0 && can('payouts.schedule') && (
                            <Button
                                size="sm"
                                onClick={handleScheduleRotation}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                <Play className="mr-1 h-3.5 w-3.5" />
                                {t('payouts.generateSchedule')}
                            </Button>
                        )}
                    </div>
                )}

                {/* Metrics */}
                <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        label={t('payouts.potAmount')}
                        value={`${Number(potAmount).toLocaleString()} ETB`}
                        hint={t('payouts.subtitle')}
                        icon={DollarSign}
                    />
                    <SummaryCard
                        label={t('payouts.paid')}
                        value={paidCount}
                        hint={t('payouts.statusDisbursed')}
                        icon={CheckCircle2}
                    />
                    <SummaryCard
                        label={t('payouts.statusApproved')}
                        value={approvedCount}
                        hint={t('payouts.makerCheckerNotice')}
                        icon={Wallet}
                    />
                    <SummaryCard
                        label={t('payouts.statusPendingApproval')}
                        value={pendingApprovalCount}
                        hint={t('common.pending')}
                        icon={Clock}
                    />
                </div>

                {/* Payout Table */}
                <Card className="w-full rounded-2xl border border-border/70 shadow-xs">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                            <span>
                                {t('payouts.payoutsList')} ({payouts.length})
                            </span>
                            <span className="text-xs font-normal text-muted-foreground">
                                {t('payouts.makerCheckerNotice')}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {payouts.length === 0 ? (
                            <div className="p-8 text-center">
                                <Wallet className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                                <p className="font-semibold">
                                    {t('common.empty')}
                                </p>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    {canCommence
                                        ? t('payouts.commencementCheck')
                                        : t('payouts.commenceBlockedTitle')}
                                </p>
                                {canCommence && can('payouts.schedule') && (
                                    <Button
                                        onClick={handleScheduleRotation}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <Play className="mr-1.5 h-4 w-4" />
                                        {t('payouts.generateSchedule')}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-4 py-3">
                                                {t('payouts.orderNumber')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('payouts.recipient')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('payouts.potAmount')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('common.date')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('common.status')}
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                {t('common.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {payouts.map((payout) => {
                                            const canRequest =
                                                payout.status === 'scheduled' &&
                                                can('payouts.request');
                                            const canApprove =
                                                payout.status ===
                                                    'pending_approval' &&
                                                payout.requested_by !==
                                                    currentUserId &&
                                                can('payouts.approve');
                                            const canDisburse =
                                                payout.status === 'approved' &&
                                                payout.approved_by !==
                                                    currentUserId &&
                                                can('payouts.disburse');
                                            const canComplete =
                                                payout.status === 'disbursed' &&
                                                can('payouts.disburse');

                                            return (
                                                <tr
                                                    key={payout.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <td className="px-4 py-3 font-mono font-semibold">
                                                        #
                                                        {payout.payout_sequence}
                                                        {payout.lottery_draw_id && (
                                                            <span className="ml-1 text-[10px] font-normal text-purple-600">
                                                                (
                                                                {t(
                                                                    'lottery.title',
                                                                )}
                                                                )
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        <div>
                                                            {
                                                                payout
                                                                    .member_profile
                                                                    ?.full_name
                                                            }
                                                        </div>
                                                        <div className="font-mono text-xs text-muted-foreground">
                                                            {
                                                                payout
                                                                    .membership
                                                                    ?.membership_number
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-semibold text-emerald-600">
                                                        {Number(
                                                            payout.amount,
                                                        ).toLocaleString()}{' '}
                                                        ETB
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">
                                                        {payout.disbursed_on ??
                                                            payout.scheduled_on ??
                                                            '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {payout.status ===
                                                        'completed' ? (
                                                            <Badge className="bg-emerald-700 text-white">
                                                                {t(
                                                                    'payouts.completed',
                                                                )}{' '}
                                                                ✓
                                                            </Badge>
                                                        ) : payout.status ===
                                                          'disbursed' ? (
                                                            <Badge className="bg-emerald-600 text-white">
                                                                {t(
                                                                    'payouts.statusDisbursed',
                                                                )}
                                                            </Badge>
                                                        ) : payout.status ===
                                                          'approved' ? (
                                                            <Badge className="bg-blue-600 text-white">
                                                                {t(
                                                                    'payouts.statusApproved',
                                                                )}
                                                            </Badge>
                                                        ) : payout.status ===
                                                          'pending_approval' ? (
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-amber-100 text-amber-800"
                                                            >
                                                                {t(
                                                                    'payouts.statusPendingApproval',
                                                                )}
                                                            </Badge>
                                                        ) : payout.status ===
                                                          'cancelled' ? (
                                                            <Badge variant="destructive">
                                                                {t(
                                                                    'payouts.statusCancelled',
                                                                )}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">
                                                                {t(
                                                                    'payouts.statusScheduled',
                                                                )}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="space-x-2 px-4 py-3 text-right">
                                                        {canRequest && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 text-xs"
                                                                onClick={() =>
                                                                    handleRequestApproval(
                                                                        payout.id,
                                                                    )
                                                                }
                                                            >
                                                                {t(
                                                                    'payouts.requestApproval',
                                                                )}
                                                            </Button>
                                                        )}

                                                        {canApprove && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 bg-blue-600 text-xs text-white hover:bg-blue-700"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        payout.id,
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                                                {t(
                                                                    'payouts.approvePayout',
                                                                )}
                                                            </Button>
                                                        )}

                                                        {canDisburse && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                                                                onClick={() =>
                                                                    setDisbursingPayout(
                                                                        payout,
                                                                    )
                                                                }
                                                            >
                                                                <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                                                                {t(
                                                                    'payouts.disburse',
                                                                )}
                                                            </Button>
                                                        )}

                                                        {canComplete && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 text-xs"
                                                                onClick={() =>
                                                                    handleComplete(
                                                                        payout.id,
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                                                {t(
                                                                    'common.confirm',
                                                                )}
                                                            </Button>
                                                        )}

                                                        <Link
                                                            href={`/groups/${group.id}/payouts/${payout.id}`}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-xs"
                                                            >
                                                                {t(
                                                                    'common.view',
                                                                )}
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Disburse Modal */}
                <DisbursePayoutModal
                    payout={disbursingPayout}
                    groupId={group.id}
                    open={!!disbursingPayout}
                    onClose={() => setDisbursingPayout(null)}
                />
            </PageContainer>
        </>
    );
}
