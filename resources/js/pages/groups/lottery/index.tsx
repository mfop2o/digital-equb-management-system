import { Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Eye,
    Hash,
    ShieldAlert,
    ShieldCheck,
    Shuffle,
    Users,
} from 'lucide-react';
import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import type { EqubCycle, EqubGroup, LotteryDraw } from '@/types/equb';

interface Props {
    group: EqubGroup;
    cycle: EqubCycle | null;
    draws: LotteryDraw[];
    canCommence: boolean;
    commencementBlockedReasons: string[];
}

export default function LotteryIndex({
    group,
    cycle: _cycle,
    draws,
    canCommence,
    commencementBlockedReasons,
}: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();

    const confirmedCount = draws.filter(
        (d) => d.status === 'winner_confirmed',
    ).length;
    const pendingCount = draws.filter((d) => d.status === 'pending').length;

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('lottery.title'),
                href: `/groups/${group.id}/lottery`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('lottery.title')} — ${group.name}`} />

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('lottery.title')}
                    description={t('lottery.subtitle')}
                    actions={
                        canCommence && can('payouts.schedule') ? (
                            <Link href={`/groups/${group.id}/lottery/prepare`}>
                                <Button
                                    className="bg-purple-600 text-white hover:bg-purple-700"
                                    size="sm"
                                >
                                    <Shuffle className="mr-1.5 h-4 w-4" />
                                    {t('lottery.conductNextDraw')}
                                </Button>
                            </Link>
                        ) : undefined
                    }
                />

                {/* Commencement gate banner */}
                {!canCommence ? (
                    <div className="rounded-2xl border border-rose-500/25 bg-rose-500/8 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
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
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
                        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                        {t('payouts.commencementCheck')}
                    </div>
                )}

                {/* Metrics */}
                <div className="grid w-full gap-4 sm:grid-cols-3">
                    <SummaryCard
                        label={t('lottery.drawsConducted')}
                        value={confirmedCount}
                        hint={t('lottery.winner')}
                        icon={CheckCircle2}
                    />
                    <SummaryCard
                        label={t('lottery.pendingDraws')}
                        value={pendingCount}
                        hint={t('common.pending')}
                        icon={Clock}
                    />
                    <SummaryCard
                        label={t('members.totalMembers')}
                        value={group.max_members}
                        hint={t('nav.equbGroups')}
                        icon={Users}
                    />
                </div>

                {/* Draws list */}
                <Card className="w-full overflow-hidden rounded-2xl border border-border/70 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">
                            {t('lottery.drawHistory')}
                        </CardTitle>
                        {canCommence && can('payouts.schedule') && (
                            <Link href={`/groups/${group.id}/lottery/prepare`}>
                                <Button
                                    size="sm"
                                    className="bg-purple-600 text-white hover:bg-purple-700"
                                >
                                    <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                                    {t('lottery.newDraw')}
                                </Button>
                            </Link>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {draws.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground">
                                <Shuffle className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                <p className="font-semibold">
                                    {t('lottery.noDraws')}
                                </p>
                                <p className="mt-1 text-sm">
                                    {canCommence
                                        ? t('lottery.conductNextDraw')
                                        : t('payouts.commenceBlockedTitle')}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-4 py-3">
                                                {t('lottery.drawNumber')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('lottery.winner')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('lottery.eligibleMembers')}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t('lottery.method')}
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
                                        {draws.map((draw) => (
                                            <tr
                                                key={draw.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 font-mono font-bold">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Hash className="h-3.5 w-3.5 text-purple-500" />
                                                        {draw.payout_sequence}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {draw.winning_membership
                                                        ?.member_profile
                                                        ?.full_name ?? '—'}
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {
                                                            draw
                                                                .winning_membership
                                                                ?.membership_number
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {draw.eligible_count}
                                                </td>
                                                <td className="px-4 py-3 text-xs capitalize">
                                                    {draw.draw_method.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {draw.conducted_at
                                                        ? new Date(
                                                              draw.conducted_at,
                                                          ).toLocaleString()
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {draw.status ===
                                                    'winner_confirmed' ? (
                                                        <Badge className="bg-emerald-600 text-white">
                                                            {t(
                                                                'common.completed',
                                                            )}
                                                        </Badge>
                                                    ) : draw.status ===
                                                      'cancelled' ? (
                                                        <Badge variant="destructive">
                                                            {t(
                                                                'payouts.statusCancelled',
                                                            )}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            {t(
                                                                'common.pending',
                                                            )}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/groups/${group.id}/lottery/${draw.id}`}
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 gap-1 text-xs"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            {t('lottery.audit')}
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
