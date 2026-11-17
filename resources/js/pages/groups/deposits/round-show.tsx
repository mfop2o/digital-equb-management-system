import { Head, router, setLayoutProps } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    ShieldAlert,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
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
    DepositObligation,
    DepositRound,
    EqubGroup,
    Payment,
} from '@/types/equb';

interface Props {
    group: EqubGroup;
    round: DepositRound;
    obligations: DepositObligation[];
    currentUserId: number;
    isSuperAdmin?: boolean;
}

const PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Bank transfer' },
    { value: 'mobile_money', label: 'Mobile money (Telebirr / CBE Birr)' },
    { value: 'cash', label: 'Cash on hand' },
    { value: 'cheque', label: 'Cheque' },
];

function RecordDepositDialog({
    obligation,
    group,
    round,
    onClose,
}: {
    obligation: DepositObligation;
    group: EqubGroup;
    round: DepositRound;
    onClose: () => void;
}) {
    const [amount, setAmount] = useState(obligation.amount_due);
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
            `/groups/${group.id}/deposits/obligations/${obligation.id}/pay`,
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
                        Record initial deposit
                    </DialogTitle>
                    <DialogDescription>
                        {obligation.member_profile?.full_name} · {round.label} ·
                        Due {formatEtb(obligation.amount_due)}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="d-amount">Amount (ETB)</Label>
                        <Input
                            id="d-amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="d-method">Payment method</Label>
                        <select
                            id="d-method"
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
                        <Label htmlFor="d-ref">
                            Reference / transaction ID
                        </Label>
                        <Input
                            id="d-ref"
                            placeholder="e.g. FT2608… or Telebirr ID"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="d-date">Date paid</Label>
                        <Input
                            id="d-date"
                            type="date"
                            value={paidOn}
                            onChange={(e) => setPaidOn(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="d-notes">Notes</Label>
                        <Input
                            id="d-notes"
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
                            {submitting ? 'Recording…' : 'Record deposit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function VerifyDepositDialog({
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
            `/groups/${group.id}/deposits/payments/${payment.id}/verify`,
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
                        Verify initial deposit
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
                            <Label htmlFor="d-reason">Rejection reason</Label>
                            <Input
                                id="d-reason"
                                placeholder="Explain why this payment is rejected"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    {decision === 'verified' && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                            Verifying posts a double-entry ledger entry to the
                            Deposits Held account and issues a receipt.
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

export default function DepositRoundShow({
    group,
    round,
    obligations,
    currentUserId,
    isSuperAdmin,
}: Props) {
    const { can } = usePermissions();

    const [payingObligation, setPayingObligation] =
        useState<DepositObligation | null>(null);
    const [verifyingPayment, setVerifyingPayment] = useState<Payment | null>(
        null,
    );

    const verifiedCount = obligations.filter(
        (o) => o.status === 'verified',
    ).length;
    const submittedCount = obligations.filter(
        (o) => o.status === 'submitted',
    ).length;
    const pendingCount = obligations.filter(
        (o) => o.status === 'pending',
    ).length;
    const exemptCount = obligations.filter((o) => o.is_exempt).length;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Equb Groups', href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: 'Initial Deposits',
                href: `/groups/${group.id}/deposits`,
            },
            { title: round.label, href: '#' },
        ],
    });

    return (
        <>
            <Head title={`${round.label} — ${group.name}`} />

            <PageContainer>
                <PageHeader
                    eyebrow="Initial deposits"
                    title={round.label}
                    description={`${formatEtb(round.amount_per_member)} per paying member · Due ${round.due_on}`}
                    icon={ShieldCheck}
                    backHref={`/groups/${group.id}/deposits`}
                    backLabel="All deposit rounds"
                    actions={<StatusBadge status={round.status} />}
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
                        label="Pending"
                        value={pendingCount}
                        hint="Not yet submitted"
                        icon={DollarSign}
                        tone="amber"
                    />
                    <SummaryCard
                        label="Exempt"
                        value={exemptCount}
                        hint="No obligation"
                        icon={Award}
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
                                            {o.is_exempt
                                                ? '—'
                                                : formatEtb(o.amount_due)}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'paid',
                                    header: 'Paid',
                                    mobileLabel: 'Paid',
                                    render: (o) => (
                                        <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                            {o.is_exempt
                                                ? '—'
                                                : formatEtb(o.amount_paid)}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'status',
                                    header: 'Status',
                                    mobileLabel: 'Status',
                                    render: (o) => (
                                        <StatusBadge
                                            status={
                                                o.is_exempt
                                                    ? 'exempt'
                                                    : o.status
                                            }
                                        />
                                    ),
                                },
                                {
                                    key: 'payment',
                                    header: 'Payment info',
                                    mobileLabel: 'Payment',
                                    render: (o) => {
                                        const payment =
                                            o.allocations?.[0]?.payment;

                                        if (!payment || o.is_exempt) {
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
                                            !o.is_exempt &&
                                            o.status === 'pending' &&
                                            can('deposits.record');
                                        const isSelfSubmitted =
                                            payment &&
                                            payment.submitted_by_user_id ===
                                                currentUserId;
                                        const canVerify =
                                            !o.is_exempt &&
                                            o.status === 'submitted' &&
                                            payment &&
                                            (isSuperAdmin ||
                                                !isSelfSubmitted) &&
                                            can('deposits.verify');

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
                <RecordDepositDialog
                    obligation={payingObligation}
                    group={group}
                    round={round}
                    onClose={() => setPayingObligation(null)}
                />
            )}
            {verifyingPayment && (
                <VerifyDepositDialog
                    payment={verifyingPayment}
                    group={group}
                    onClose={() => setVerifyingPayment(null)}
                />
            )}
        </>
    );
}
