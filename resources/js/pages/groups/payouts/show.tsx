import { Head, router, setLayoutProps } from '@inertiajs/react';
import {
    ArrowUpRight,
    CheckCircle2,
    Clock,
    ShieldAlert,
    ShieldCheck,
    UserCheck,
    Wallet,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { DisbursePayoutModal } from '@/components/disburse-payout-modal';
import { DetailItem, DetailList } from '@/components/detail-list';
import { GroupNavigation } from '@/components/group-navigation';
import { formatEtb } from '@/components/money';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
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
import type { EqubGroup, Payout } from '@/types/equb';

interface Props {
    group: EqubGroup;
    payout: Payout;
    currentUserId: number;
    isSuperAdmin?: boolean;
}

export default function PayoutShow({
    group,
    payout,
    currentUserId,
    isSuperAdmin,
}: Props) {
    const { can } = usePermissions();
    const [disbursingPayout, setDisbursingPayout] = useState<Payout | null>(
        null,
    );

    const handleRequestApproval = () => {
        router.post(
            `/groups/${group.id}/payouts/${payout.id}/request-approval`,
        );
    };

    const handleApprove = () => {
        router.post(`/groups/${group.id}/payouts/${payout.id}/approve`);
    };

    const handleComplete = () => {
        router.post(`/groups/${group.id}/payouts/${payout.id}/complete`);
    };

    const canRequest = payout.status === 'scheduled' && can('payouts.request');
    const canApprove =
        payout.status === 'pending_approval' &&
        (isSuperAdmin || payout.requested_by !== currentUserId) &&
        can('payouts.approve');
    const canDisburse =
        payout.status === 'approved' &&
        (isSuperAdmin || payout.approved_by !== currentUserId) &&
        can('payouts.disburse');
    const canComplete =
        payout.status === 'disbursed' && can('payouts.disburse');

    const steps = [
        {
            label: 'Scheduled',
            done: true,
            active: payout.status === 'scheduled',
        },
        {
            label: 'Approval requested',
            done: [
                'pending_approval',
                'approved',
                'disbursed',
                'completed',
            ].includes(payout.status),
            active: payout.status === 'pending_approval',
        },
        {
            label: 'Approved',
            done: ['approved', 'disbursed', 'completed'].includes(
                payout.status,
            ),
            active: payout.status === 'approved',
        },
        {
            label: 'Disbursed',
            done: ['disbursed', 'completed'].includes(payout.status),
            active: payout.status === 'disbursed',
        },
        {
            label: 'Completed',
            done: payout.status === 'completed',
            active: payout.status === 'completed',
        },
    ];

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Equb Groups', href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            { title: 'Payouts', href: `/groups/${group.id}/payouts` },
            { title: `Slot #${payout.payout_sequence}`, href: '#' },
        ],
    });

    return (
        <>
            <Head
                title={`Payout Slot #${payout.payout_sequence} — ${group.name}`}
            />

            <PageContainer>
                <PageHeader
                    eyebrow="Payout schedule"
                    title={`Payout slot #${payout.payout_sequence}`}
                    description={`Disbursement record for ${payout.member_profile?.full_name}. Full pot: ${formatEtb(payout.amount)}.`}
                    icon={Wallet}
                    backHref={`/groups/${group.id}/payouts`}
                    backLabel="Back to schedule"
                    actions={
                        <>
                            <StatusBadge status={payout.status} />
                            {payout.lottery_draw_id && (
                                <Badge
                                    variant="outline"
                                    className="text-[11px]"
                                >
                                    Lottery draw
                                </Badge>
                            )}
                        </>
                    }
                />

                <GroupNavigation groupId={group.id} />

                <Card>
                    <CardContent className="overflow-x-auto py-4">
                        <ol className="flex min-w-[38rem] items-center gap-2">
                            {steps.map((step, index) => (
                                <Fragment key={step.label}>
                                    <li className="flex shrink-0 flex-col items-center gap-1.5">
                                        <div
                                            className={`flex size-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                                step.done
                                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                                    : step.active
                                                      ? 'animate-pulse border-blue-600 bg-blue-600 text-white'
                                                      : 'border-muted bg-muted/30 text-muted-foreground'
                                            }`}
                                        >
                                            {step.done ? (
                                                <CheckCircle2 className="size-4" />
                                            ) : (
                                                index + 1
                                            )}
                                        </div>
                                        <span
                                            className={`text-center text-[11px] font-medium ${
                                                step.done
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : step.active
                                                      ? 'text-blue-600 dark:text-blue-400'
                                                      : 'text-muted-foreground'
                                            }`}
                                        >
                                            {step.label}
                                        </span>
                                    </li>
                                    {index < steps.length - 1 && (
                                        <li
                                            aria-hidden
                                            className={`mx-1 h-0.5 min-w-6 flex-1 rounded ${
                                                steps[index + 1].done ||
                                                steps[index + 1].active
                                                    ? 'bg-emerald-400'
                                                    : 'bg-muted'
                                            }`}
                                        />
                                    )}
                                </Fragment>
                            ))}
                        </ol>
                    </CardContent>
                </Card>

                {(canRequest ||
                    canApprove ||
                    canDisburse ||
                    canComplete ||
                    (payout.status === 'pending_approval' &&
                        payout.requested_by === currentUserId &&
                        !isSuperAdmin) ||
                    (payout.status === 'approved' &&
                        payout.approved_by === currentUserId &&
                        !isSuperAdmin)) && (
                    <Card>
                        <CardContent className="space-y-3 py-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="mr-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Next action
                                </span>

                                {canRequest && (
                                    <Button
                                        variant="outline"
                                        onClick={handleRequestApproval}
                                    >
                                        <Clock className="size-4" />
                                        Request approval
                                    </Button>
                                )}

                                {canApprove && (
                                    <Button
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={handleApprove}
                                    >
                                        <ShieldCheck className="size-4" />
                                        Approve payout
                                    </Button>
                                )}

                                {canDisburse && (
                                    <Button
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        onClick={() =>
                                            setDisbursingPayout(payout)
                                        }
                                    >
                                        <ArrowUpRight className="size-4" />
                                        Disburse funds
                                    </Button>
                                )}

                                {canComplete && (
                                    <Button
                                        variant="outline"
                                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                        onClick={handleComplete}
                                    >
                                        <CheckCircle2 className="size-4" />
                                        Mark as completed
                                    </Button>
                                )}
                            </div>

                            {payout.status === 'pending_approval' &&
                                payout.requested_by === currentUserId &&
                                !isSuperAdmin && (
                                    <p className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                        <ShieldAlert className="size-3.5" />
                                        You requested this payout — another user
                                        must approve it.
                                    </p>
                                )}
                            {payout.status === 'approved' &&
                                payout.approved_by === currentUserId &&
                                !isSuperAdmin && (
                                    <p className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                        <ShieldAlert className="size-3.5" />
                                        You approved this payout — another user
                                        must disburse it.
                                    </p>
                                )}
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-5 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UserCheck className="size-4 text-emerald-600" />
                                Recipient
                            </CardTitle>
                            <CardDescription>
                                Member receiving this rotation payout.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailList>
                                <DetailItem
                                    label="Full name"
                                    value={payout.member_profile?.full_name}
                                />
                                <DetailItem
                                    label="Membership number"
                                    mono
                                    value={payout.membership?.membership_number}
                                />
                                <DetailItem
                                    label="Phone"
                                    value={payout.member_profile?.phone}
                                />
                                <DetailItem
                                    label="Payout amount"
                                    emphasis
                                    value={formatEtb(payout.amount)}
                                />
                                <DetailItem
                                    label="Scheduled date"
                                    value={payout.scheduled_on}
                                />
                            </DetailList>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ShieldCheck className="size-4 text-blue-600" />
                                Dual-approval audit trail
                            </CardTitle>
                            <CardDescription>
                                Maker and checker actions are recorded
                                separately.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailList>
                                <DetailItem
                                    label="Requested by"
                                    value={
                                        payout.requester?.name ??
                                        'Not requested yet'
                                    }
                                />
                                <DetailItem
                                    label="Approved by"
                                    value={
                                        payout.approver?.name ??
                                        'Pending approval'
                                    }
                                />
                                <DetailItem
                                    label="Approved at"
                                    value={
                                        payout.approved_at
                                            ? new Date(
                                                  payout.approved_at,
                                              ).toLocaleString()
                                            : null
                                    }
                                />
                                <DetailItem
                                    label="Disbursed by"
                                    value={
                                        payout.disburser?.name ??
                                        'Pending disbursement'
                                    }
                                />
                                <DetailItem
                                    label="Disbursed on"
                                    value={payout.disbursed_on}
                                />
                                <DetailItem
                                    label="Disbursement ref"
                                    mono
                                    value={payout.disbursement_reference}
                                />
                                <DetailItem
                                    label="Method"
                                    value={payout.method?.replace('_', ' ')}
                                />
                                <DetailItem
                                    label="Account ref"
                                    mono
                                    value={payout.account_reference}
                                />
                                <DetailItem
                                    label="Completed at"
                                    value={
                                        payout.completed_at
                                            ? new Date(
                                                  payout.completed_at,
                                              ).toLocaleString()
                                            : null
                                    }
                                />
                            </DetailList>
                        </CardContent>
                    </Card>
                </div>

                {payout.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {payout.notes}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </PageContainer>

            <DisbursePayoutModal
                payout={disbursingPayout}
                groupId={group.id}
                open={!!disbursingPayout}
                onClose={() => setDisbursingPayout(null)}
            />
        </>
    );
}
