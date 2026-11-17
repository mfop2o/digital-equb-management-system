import { Head, router, setLayoutProps } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Play,
    ShieldAlert,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { GroupNavigation } from '@/components/group-navigation';
import { formatEtb } from '@/components/money';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { SummaryCard } from '@/components/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import type {
    ContributionObligation,
    ContributionPeriod,
    EqubGroup,
    Payment,
} from '@/types/equb';

interface Props {
    group: EqubGroup;
    period: ContributionPeriod;
    obligations: ContributionObligation[];
    currentUserId: number;
    isSuperAdmin?: boolean;
}

const PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Bank transfer' },
    { value: 'mobile_money', label: 'Mobile money (Telebirr / CBE Birr)' },
    { value: 'cash', label: 'Cash on hand' },
    { value: 'cheque', label: 'Cheque' },
];

function RecordPaymentDialog({
    obligation,
    group,
    defaultAmount,
    onClose,
}: {
    obligation: ContributionObligation;
    group: EqubGroup;
    defaultAmount: string;
    onClose: () => void;
}) {
    const [amount, setAmount] = useState(defaultAmount);
    const [method, setMethod] = useState('bank_transfer');
    const [reference, setReference] = useState('');
    const [paidOn, setPaidOn] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            `/groups/${group.id}/contributions/obligations/${obligation.id}/pay`,
            { amount, method, reference, paid_on: paidOn, notes },
            {
                onFinish: () => {
                    setSubmitting(false);
                    onClose();
                },
            },
        );
    };

    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="size-5 text-emerald-600" />
                        Record contribution
                    </DialogTitle>
                    <DialogDescription>
                        {obligation.member_profile?.full_name} · Due{' '}
                        {formatEtb(obligation.amount_due)}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="c-amount">Amount (ETB)</Label>
                        <Input
                            id="c-amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="c-method">Payment method</Label>
                        <select
                            id="c-method"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            {PAYMENT_METHODS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="c-ref">
                            Reference / transaction ID
                        </Label>
                        <Input
                            id="c-ref"
                            placeholder="e.g. FT2608… or Telebirr ID"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="c-date">Date paid</Label>
                        <Input
                            id="c-date"
                            type="date"
                            value={paidOn}
                            onChange={(e) => setPaidOn(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="c-notes">Notes</Label>
                        <Input
                            id="c-notes"
                            placeholder="Optional"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {submitting ? 'Recording…' : 'Record payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function VerifyPaymentDialog({
    payment,
    group,
    onClose,
}: {
    payment: Payment;
    group: EqubGroup;
    onClose: () => void;
}) {
    const [decision, setDecision] = useState<'verified' | 'rejected'>(
        'verified',
    );
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            `/groups/${group.id}/contributions/payments/${payment.id}/verify`,
            { decision, reason },
            {
                onFinish: () => {
                    setSubmitting(false);
                    onClose();
                },
            },
        );
    };

    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="size-5 text-blue-600" />
                        Verify contribution
                    </DialogTitle>
                    <DialogDescription>
                        {formatEtb(payment.amount)} ·{' '}
                        {payment.method?.replace('_', ' ')}
                        {payment.reference && ` · Ref: ${payment.reference}`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setDecision('verified')}
                            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                                decision === 'verified'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                                    : 'border-border text-muted-foreground hover:border-emerald-400'
                            }`}
                        >
                            <CheckCircle2 className="size-4" /> Verify
                        </button>
                        <button
                            type="button"
                            onClick={() => setDecision('rejected')}
                            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                                decision === 'rejected'
                                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40'
                                    : 'border-border text-muted-foreground hover:border-red-400'
                            }`}
                        >
                            <XCircle className="size-4" /> Reject
                        </button>
                    </div>
                    {decision === 'rejected' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="c-reason">Rejection reason</Label>
                            <Input
                                id="c-reason"
                                placeholder="Explain why this payment is rejected"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    {decision === 'verified' && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                            Verifying posts a double-entry ledger entry and
                            issues a receipt. This cannot be undone; reversals
                            create a new entry.
                        </div>
                    )}
                    <DialogFooter className="gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className={
                                decision === 'verified'
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                            }
                        >
                            {submitting
                                ? 'Saving…'
                                : decision === 'verified'
                                  ? 'Confirm verification'
                                  : 'Confirm rejection'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ContributionPeriodShow({
    group,
    period,
    obligations,
    currentUserId,
    isSuperAdmin,
}: Props) {
    const { can } = usePermissions();

    const [payingObligation, setPayingObligation] =
        useState<ContributionObligation | null>(null);
    const [verifyingPayment, setVerifyingPayment] = useState<Payment | null>(
        null,
    );

    const handleGenerateObligations = () => {
        router.post(
            `/groups/${group.id}/contributions/periods/${period.id}/obligations`,
        );
    };

    const verifiedCount = obligations.filter(
        (o) => o.status === 'verified',
    ).length;
    const submittedCount = obligations.filter(
        (o) => o.status === 'submitted',
    ).length;
    const pendingCount = obligations.filter(
        (o) => o.status === 'pending' || o.status === 'overdue',
    ).length;
    const potCollected = verifiedCount * Number(period.amount_due_snapshot);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Equb Groups', href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: 'Contributions',
                href: `/groups/${group.id}/contributions`,
            },
            { title: period.label, href: '#' },
        ],
    });

    return (
        <>
            <Head title={`${period.label} — ${group.name}`} />

            <PageContainer>
                <PageHeader
                    eyebrow="Contributions"
                    title={period.label}
                    description={`${formatEtb(period.amount_due_snapshot)} per member · Due ${period.due_on}`}
                    icon={DollarSign}
                    backHref={`/groups/${group.id}/contributions`}
                    backLabel="All contribution periods"
                    actions={
                        <>
                            <StatusBadge status={period.status} />
                            {obligations.length === 0 &&
                                can('contributions.generate') && (
                                    <Button
                                        onClick={handleGenerateObligations}
                                        size="sm"
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <Play className="size-4" />
                                        Generate obligations
                                    </Button>
                                )}
                        </>
                    }
                />

                <GroupNavigation groupId={group.id} />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label="Verified"
                        value={verifiedCount}
                        hint="Payments confirmed"
                        icon={CheckCircle2}
                        tone="emerald"
                    />
                    <SummaryCard
                        label="Under review"
                        value={submittedCount}
                        hint="Awaiting verification"
                        icon={Clock}
                        tone="blue"
                    />
                    <SummaryCard
                        label="Pending / overdue"
                        value={pendingCount}
                        hint="Not yet paid"
                        icon={DollarSign}
                        tone="amber"
                    />
                    <SummaryCard
                        label="Pot collected"
                        value={formatEtb(potCollected)}
                        hint="From verified payments only"
                        icon={Award}
                        tone="violet"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                            <span>
                                Member obligations ({obligations.length})
                            </span>
                            <span className="flex items-center gap-3 text-[11px] font-normal text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <span className="inline-block size-2 rounded-full bg-emerald-500" />
                                    Verified
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-block size-2 rounded-full bg-blue-500" />
                                    Under review
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-block size-2 rounded-full bg-slate-400" />
                                    Pending
                                </span>
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-2 sm:px-6">
                        <DataTable
                            rows={obligations}
                            getRowKey={(o) => o.id}
                            empty={
                                <EmptyState
                                    title="No obligations generated yet"
                                    description="Generate obligations to create payment requirements for all active members."
                                    action={
                                        can('contributions.generate') ? (
                                            <Button
                                                onClick={
                                                    handleGenerateObligations
                                                }
                                                size="sm"
                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            >
                                                <Play className="size-4" />
                                                Generate obligations
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            }
                            columns={[
                                {
                                    key: 'member',
                                    header: 'Member',
                                    mobileLabel: 'Member',
                                    render: (o) => (
                                        <div>
                                            <div className="text-sm font-semibold">
                                                {o.member_profile?.full_name ??
                                                    '—'}
                                            </div>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {
                                                    o.membership
                                                        ?.membership_number
                                                }
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'role',
                                    header: 'Role',
                                    mobileLabel: 'Role',
                                    hideOnMobile: true,
                                    render: (o) => (
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {o.membership?.role}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'due',
                                    header: 'Amount due',
                                    mobileLabel: 'Due',
                                    render: (o) => (
                                        <span className="font-mono text-sm font-medium">
                                            {formatEtb(o.amount_due)}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'paid',
                                    header: 'Paid',
                                    mobileLabel: 'Paid',
                                    render: (o) => (
                                        <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                            {formatEtb(o.amount_paid)}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'status',
                                    header: 'Status',
                                    mobileLabel: 'Status',
                                    render: (o) => (
                                        <StatusBadge status={o.status} />
                                    ),
                                },
                                {
                                    key: 'payment',
                                    header: 'Payment info',
                                    mobileLabel: 'Payment',
                                    render: (o) => {
                                        const payment =
                                            o.allocations?.[0]?.payment;

                                        if (!payment) {
                                            return (
                                                <span className="text-xs text-muted-foreground">
                                                    —
                                                </span>
                                            );
                                        }

                                        return (
                                            <div className="space-y-0.5 text-xs">
                                                <div className="font-medium capitalize">
                                                    {payment.method?.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </div>
                                                {payment.reference && (
                                                    <div className="font-mono text-[11px] text-muted-foreground">
                                                        {payment.reference}
                                                    </div>
                                                )}
                                                <div className="text-[11px] text-muted-foreground">
                                                    {payment.submitted_by
                                                        ?.name ?? 'Staff'}{' '}
                                                    · {payment.paid_on}
                                                </div>
                                            </div>
                                        );
                                    },
                                },
                                {
                                    key: 'actions',
                                    header: '',
                                    className: 'text-right',
                                    cellClassName: 'text-right',
                                    render: (o) => {
                                        const payment =
                                            o.allocations?.[0]?.payment;
                                        const canRecord =
                                            o.status === 'pending' &&
                                            can('contributions.record');
                                        const isSelfSubmitted =
                                            payment &&
                                            payment.submitted_by_user_id ===
                                                currentUserId;
                                        const canVerify =
                                            o.status === 'submitted' &&
                                            payment &&
                                            (isSuperAdmin ||
                                                !isSelfSubmitted) &&
                                            can('contributions.verify');

                                        return (
                                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                                                {canRecord && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setPayingObligation(
                                                                o,
                                                            )
                                                        }
                                                    >
                                                        <CreditCard className="size-3.5" />
                                                        Record
                                                    </Button>
                                                )}
                                                {canVerify && payment && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                        onClick={() =>
                                                            setVerifyingPayment(
                                                                payment,
                                                            )
                                                        }
                                                    >
                                                        <ShieldCheck className="size-3.5" />
                                                        Verify
                                                    </Button>
                                                )}
                                                {isSelfSubmitted &&
                                                    o.status === 'submitted' &&
                                                    !isSuperAdmin && (
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1 text-[10px]"
                                                        >
                                                            <ShieldAlert className="size-3" />
                                                            Awaiting another
                                                            verifier
                                                        </Badge>
                                                    )}
                                                {isSelfSubmitted &&
                                                    o.status === 'submitted' &&
                                                    isSuperAdmin && (
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1 text-[10px]"
                                                        >
                                                            <ShieldCheck className="size-3" />
                                                            Super admin may
                                                            verify
                                                        </Badge>
                                                    )}
                                            </div>
                                        );
                                    },
                                },
                            ]}
                        />
                    </CardContent>
                </Card>
            </PageContainer>

            {payingObligation && (
                <RecordPaymentDialog
                    obligation={payingObligation}
                    group={group}
                    defaultAmount={payingObligation.amount_due}
                    onClose={() => setPayingObligation(null)}
                />
            )}
            {verifyingPayment && (
                <VerifyPaymentDialog
                    payment={verifyingPayment}
                    group={group}
                    onClose={() => setVerifyingPayment(null)}
                />
            )}
        </>
    );
}
