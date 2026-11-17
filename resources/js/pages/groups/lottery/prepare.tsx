import { Head, setLayoutProps } from '@inertiajs/react';
import { Info, Shuffle, Users, XCircle } from 'lucide-react';
import { LotteryDrum } from '@/components/lottery-drum';
import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EqubCycle, EqubGroup, LotteryDraw } from '@/types/equb';

interface EligibleMember {
    id: number;
    full_name: string;
    membership_number: string;
    role: string;
}

interface Props {
    group: EqubGroup;
    cycle: EqubCycle;
    nextSequence: number;
    eligibleMembers: EligibleMember[];
    existingDraws: LotteryDraw[];
}

export default function LotteryPrepare({
    group,
    cycle,
    nextSequence,
    eligibleMembers,
    existingDraws,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Equb Groups', href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            { title: 'Lottery Draws', href: `/groups/${group.id}/lottery` },
            { title: `Draw #${nextSequence}`, href: '#' },
        ],
    });

    return (
        <>
            <Head title={`Lottery Draw #${nextSequence} — ${group.name}`} />

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={`Lottery Draw #${nextSequence}`}
                    description={`Cryptographic server-side draw for ${group.name}. ${eligibleMembers.length} eligible member${eligibleMembers.length !== 1 ? 's' : ''}. Result is immutable.`}
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Lottery drum animation - main column */}
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-3 dark:from-purple-950/30 dark:to-violet-950/30">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Shuffle className="h-5 w-5 text-purple-600" />
                                    Lottery Draw Machine
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <LotteryDrum
                                    groupId={group.id}
                                    payoutSequence={nextSequence}
                                    eligibleMembers={eligibleMembers}
                                />
                            </CardContent>
                        </Card>

                        {/* Exclusion rules */}
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            <p className="mb-2 flex items-center gap-1.5 font-semibold">
                                <Info className="h-4 w-4 text-blue-500" />
                                Eligibility rules applied automatically
                            </p>
                            <div className="grid list-none grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                                <div className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-red-400">
                                        ✗
                                    </span>
                                    <span>
                                        Already received a payout in Cycle #
                                        {cycle.cycle_number}
                                    </span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-red-400">
                                        ✗
                                    </span>
                                    <span>
                                        Has overdue contribution obligation
                                    </span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-red-400">
                                        ✗
                                    </span>
                                    <span>
                                        Current contribution not verified
                                    </span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-red-400">
                                        ✗
                                    </span>
                                    <span>Suspended or withdrawn members</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side panel - eligible members */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    Eligible Participants (
                                    {eligibleMembers.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {eligibleMembers.length === 0 ? (
                                    <div className="p-6 text-center text-muted-foreground">
                                        <XCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
                                        <p className="text-sm font-semibold">
                                            No eligible members
                                        </p>
                                        <p className="mt-1 text-xs">
                                            All members may have received a
                                            payout or have outstanding
                                            obligations.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="max-h-80 divide-y overflow-y-auto">
                                        {eligibleMembers.map((m, i) => (
                                            <li
                                                key={m.id}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30"
                                            >
                                                <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                                                    {i + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {m.full_name}
                                                    </p>
                                                    <p className="font-mono text-xs text-muted-foreground">
                                                        {m.membership_number}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs capitalize"
                                                >
                                                    {m.role}
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* Previous draws */}
                        {existingDraws.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs text-muted-foreground">
                                        Previous Draws
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1.5">
                                    {existingDraws
                                        .slice(-4)
                                        .reverse()
                                        .map((d) => (
                                            <div
                                                key={d.id}
                                                className="flex items-center justify-between text-xs"
                                            >
                                                <span className="font-mono">
                                                    #{d.payout_sequence}
                                                </span>
                                                <span className="ml-2 truncate font-medium">
                                                    {d.winning_membership
                                                        ?.member_profile
                                                        ?.full_name ?? '—'}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="ml-2 text-[10px]"
                                                >
                                                    Done
                                                </Badge>
                                            </div>
                                        ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </PageContainer>
        </>
    );
}
