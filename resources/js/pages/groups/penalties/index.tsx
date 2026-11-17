import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import { useState } from 'react';

import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { useTranslation } from '@/hooks/use-translation';
import { EqubGroup } from '@/types/equb';

interface PenaltyWaiverRequest {
    id: number;
    penalty_id: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewer_notes?: string;
    created_at: string;
}

interface Penalty {
    id: number;
    equb_group_id: number;
    reason: string;
    amount: string;
    currency: string;
    status: 'pending' | 'paid' | 'waived';
    assessed_at: string;
    member_profile?: { full_name: string };
    waiver_request?: PenaltyWaiverRequest;
}

interface Summary {
    total: number;
    pending: number;
    paid: number;
    waived: number;
    total_amount: string;
    pending_amount: string;
}

interface Props {
    group: EqubGroup;
    penalties: Penalty[];
    waiverRequests: PenaltyWaiverRequest[];
    summary: Summary;
}

function AssessPenaltiesModal({
    group,
    onClose,
}: {
    group: EqubGroup;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({
        period_date: new Date().toISOString().slice(0, 10),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/groups/${group.id}/penalties/assess`, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
                <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold">
                        {t('penalties.assessPenalties')}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {t('penalties.assessDesc')}
                    </p>
                </div>
                <form onSubmit={submit} className="space-y-4 p-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            {t('penalties.periodDate')}
                        </label>
                        <input
                            type="date"
                            value={form.data.period_date}
                            onChange={(e) =>
                                form.setData('period_date', e.target.value)
                            }
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        {form.errors.period_date && (
                            <p className="mt-1 text-xs text-destructive">
                                {form.errors.period_date}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {form.processing
                                ? t('common.loading')
                                : t('penalties.assessPenalties')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function WaiverRequestModal({
    group,
    penalty,
    onClose,
}: {
    group: EqubGroup;
    penalty: Penalty;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({ reason: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/groups/${group.id}/penalties/${penalty.id}/waiver`, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
                <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold">
                        {t('penalties.requestWaiver')}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {penalty.member_profile?.full_name} — ETB{' '}
                        {parseFloat(penalty.amount).toLocaleString()}
                    </p>
                </div>
                <form onSubmit={submit} className="space-y-4 p-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            {t('penalties.waiverReason')}
                        </label>
                        <textarea
                            value={form.data.reason}
                            onChange={(e) =>
                                form.setData('reason', e.target.value)
                            }
                            rows={4}
                            placeholder="Explain why this penalty should be waived…"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        {form.errors.reason && (
                            <p className="mt-1 text-xs text-destructive">
                                {form.errors.reason}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {form.processing
                                ? t('common.loading')
                                : t('common.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ReviewWaiverModal({
    group,
    waiver,
    onClose,
}: {
    group: EqubGroup;
    waiver: PenaltyWaiverRequest;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({ decision: '', reviewer_notes: '' });

    const submit = (decision: 'approved' | 'rejected') => {
        form.setData('decision', decision);
        form.post(
            `/groups/${group.id}/penalties/waiver-requests/${waiver.id}/review`,
            {
                onSuccess: () => onClose(),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
                <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold">
                        {t('penalties.reviewWaiver')}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {t('penalties.waiverRequests')} #{waiver.id}
                    </p>
                </div>
                <div className="space-y-4 p-6">
                    <div className="rounded-lg bg-muted/50 p-4 text-sm">
                        <p className="font-medium text-muted-foreground">
                            {t('penalties.waiverReason')}:
                        </p>
                        <p className="mt-1">{waiver.reason}</p>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            {t('penalties.reviewerNotes')}
                        </label>
                        <textarea
                            value={form.data.reviewer_notes}
                            onChange={(e) =>
                                form.setData('reviewer_notes', e.target.value)
                            }
                            rows={3}
                            placeholder="Add notes…"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="button"
                            disabled={form.processing}
                            onClick={() => submit('rejected')}
                            className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        >
                            {t('common.rejected')}
                        </button>
                        <button
                            type="button"
                            disabled={form.processing}
                            onClick={() => submit('approved')}
                            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {t('common.approved')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PenaltiesIndex({
    group,
    penalties,
    waiverRequests,
    summary,
}: Props) {
    const { t } = useTranslation();
    const [showAssessModal, setShowAssessModal] = useState(false);
    const [waiverTarget, setWaiverTarget] = useState<Penalty | null>(null);
    const [reviewTarget, setReviewTarget] =
        useState<PenaltyWaiverRequest | null>(null);

    const formatMoney = (val: string | number) =>
        `ETB ${parseFloat(String(val)).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;

    const settle = (penalty: Penalty) => {
        if (
            !confirm(
                `Settle penalty of ${formatMoney(penalty.amount)} for ${penalty.member_profile?.full_name}?`,
            )
        )
            return;
        router.post(
            `/groups/${group.id}/penalties/${penalty.id}/settle`,
            { payment_method: 'cash' },
            { preserveScroll: true },
        );
    };

    const statusConfig: Record<
        string,
        { label: string; color: string; icon: React.ReactNode }
    > = {
        pending: {
            label: t('penalties.pendingPenalties'),
            color: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300',
            icon: <Clock className="h-3 w-3" />,
        },
        paid: {
            label: t('penalties.paidPenalties'),
            color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400',
            icon: <CheckCircle className="h-3 w-3" />,
        },
        waived: {
            label: t('penalties.waivedPenalties'),
            color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
            icon: <Shield className="h-3 w-3" />,
        },
    };

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('penalties.title'),
                href: `/groups/${group.id}/penalties`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('penalties.title')} — ${group.name}`} />
            {showAssessModal && (
                <AssessPenaltiesModal
                    group={group}
                    onClose={() => setShowAssessModal(false)}
                />
            )}
            {waiverTarget && (
                <WaiverRequestModal
                    group={group}
                    penalty={waiverTarget}
                    onClose={() => setWaiverTarget(null)}
                />
            )}
            {reviewTarget && (
                <ReviewWaiverModal
                    group={group}
                    waiver={reviewTarget}
                    onClose={() => setReviewTarget(null)}
                />
            )}

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('penalties.title')}
                    description={t('penalties.subtitle')}
                    actions={
                        <button
                            onClick={() => setShowAssessModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            {t('penalties.assessPenalties')}
                        </button>
                    }
                />

                {/* Summary */}
                <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
                    <SummaryCard
                        label={t('penalties.totalPenalties')}
                        value={String(summary.total)}
                        icon={AlertTriangle}
                        hint={`${formatMoney(summary.total_amount)} total`}
                    />
                    <SummaryCard
                        label={t('penalties.pendingPenalties')}
                        value={String(summary.pending)}
                        icon={Clock}
                        hint={`${formatMoney(summary.pending_amount)} outstanding`}
                    />
                    <SummaryCard
                        label={t('penalties.paidPenalties')}
                        value={String(summary.paid)}
                        icon={CheckCircle}
                        hint="Fully settled"
                    />
                    <SummaryCard
                        label={t('penalties.waivedPenalties')}
                        value={String(summary.waived)}
                        icon={Shield}
                        hint="Approved waivers"
                    />
                </div>

                {/* Penalties Table */}
                <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-base font-semibold">
                            {t('penalties.penaltiesList')}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    <th className="px-6 py-3">
                                        {t('members.fullName')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('common.reason')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('common.amount')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('common.status')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('penalties.assessedAt')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {penalties.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-muted-foreground"
                                        >
                                            {t('penalties.noPenalties')}
                                        </td>
                                    </tr>
                                ) : (
                                    penalties.map((penalty) => {
                                        const sc = statusConfig[penalty.status];
                                        return (
                                            <tr
                                                key={penalty.id}
                                                className="hover:bg-muted/20"
                                            >
                                                <td className="px-6 py-3 font-medium">
                                                    {penalty.member_profile
                                                        ?.full_name ?? '—'}
                                                </td>
                                                <td className="max-w-xs px-6 py-3 text-muted-foreground">
                                                    {penalty.reason}
                                                </td>
                                                <td className="px-6 py-3 font-semibold tabular-nums">
                                                    {formatMoney(
                                                        penalty.amount,
                                                    )}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc?.color}`}
                                                    >
                                                        {sc?.icon}
                                                        {sc?.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-xs text-muted-foreground">
                                                    {new Date(
                                                        penalty.assessed_at,
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {penalty.status ===
                                                        'pending' && (
                                                        <div className="flex gap-2">
                                                            {!penalty.waiver_request && (
                                                                <button
                                                                    onClick={() =>
                                                                        setWaiverTarget(
                                                                            penalty,
                                                                        )
                                                                    }
                                                                    className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                                                                >
                                                                    {t(
                                                                        'penalties.requestWaiver',
                                                                    )}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    settle(
                                                                        penalty,
                                                                    )
                                                                }
                                                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                                                            >
                                                                {t(
                                                                    'penalties.settlePenalty',
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pending Waiver Requests */}
                {waiverRequests.filter((w) => w.status === 'pending').length >
                    0 && (
                    <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
                        <div className="border-b px-6 py-4">
                            <h2 className="text-base font-semibold">
                                {t('penalties.waiverRequests')}
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {t('penalties.makerCheckerWaiver')}
                            </p>
                        </div>
                        <div className="divide-y">
                            {waiverRequests
                                .filter((w) => w.status === 'pending')
                                .map((w) => (
                                    <div
                                        key={w.id}
                                        className="flex items-center justify-between px-6 py-4"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {t('penalties.waiverRequests')}{' '}
                                                #{w.id}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {t('common.date')}:{' '}
                                                {new Date(
                                                    w.created_at,
                                                ).toLocaleDateString()}
                                            </p>
                                            <p className="mt-1 text-sm">
                                                {w.reason}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setReviewTarget(w)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                                        >
                                            <Shield className="h-3 w-3" />
                                            {t('common.review')}
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </PageContainer>
        </>
    );
}
