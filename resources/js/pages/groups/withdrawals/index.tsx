import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { CheckCircle, Clock, LogOut, XCircle } from 'lucide-react';
import { useState } from 'react';

import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { useTranslation } from '@/hooks/use-translation';
import { EqubGroup } from '@/types/equb';

interface MemberWithdrawal {
    id: number;
    equb_group_id: number;
    reason: string;
    status: 'requested' | 'approved' | 'rejected' | 'settled';
    settlement_type: string;
    settlement_amount?: string;
    reviewer_notes?: string;
    created_at: string;
    member_profile?: { full_name: string };
}

interface Summary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface Props {
    group: EqubGroup;
    withdrawals: MemberWithdrawal[];
    summary: Summary;
}

function ReviewWithdrawalModal({
    group,
    withdrawal,
    onClose,
}: {
    group: EqubGroup;
    withdrawal: MemberWithdrawal;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({
        decision: '',
        reviewer_notes: '',
        settlement_amount: '',
    });

    const submit = (decision: 'approved' | 'rejected') => {
        form.setData('decision', decision);
        form.post(`/groups/${group.id}/withdrawals/${withdrawal.id}/review`, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl">
                <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold">
                        {t('withdrawals.reviewWithdrawal')}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {withdrawal.member_profile?.full_name} —{' '}
                        {withdrawal.settlement_type}
                    </p>
                </div>
                <div className="space-y-4 p-6">
                    <div className="rounded-lg bg-muted/50 p-4 text-sm">
                        <p className="font-medium text-muted-foreground">
                            {t('withdrawals.memberReason')}:
                        </p>
                        <p className="mt-1">{withdrawal.reason}</p>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            {t('withdrawals.settlementAmount')} (ETB)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.data.settlement_amount}
                            onChange={(e) =>
                                form.setData(
                                    'settlement_amount',
                                    e.target.value,
                                )
                            }
                            placeholder="Leave blank for rejection"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        {form.errors.settlement_amount && (
                            <p className="mt-1 text-xs text-destructive">
                                {form.errors.settlement_amount}
                            </p>
                        )}
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
                            placeholder="Add notes for the record…"
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
                            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {t('common.approved')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function WithdrawalsIndex({
    group,
    withdrawals,
    summary,
}: Props) {
    const { t } = useTranslation();
    const [reviewTarget, setReviewTarget] = useState<MemberWithdrawal | null>(
        null,
    );

    const statusConfig: Record<
        string,
        { label: string; color: string; icon: React.ReactNode }
    > = {
        requested: {
            label: t('common.pending'),
            color: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300',
            icon: <Clock className="h-3 w-3" />,
        },
        approved: {
            label: t('common.approved'),
            color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400',
            icon: <CheckCircle className="h-3 w-3" />,
        },
        rejected: {
            label: t('common.rejected'),
            color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-400',
            icon: <XCircle className="h-3 w-3" />,
        },
        settled: {
            label: t('withdrawals.settled'),
            color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
            icon: <CheckCircle className="h-3 w-3" />,
        },
    };

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: t('withdrawals.title'),
                href: `/groups/${group.id}/withdrawals`,
            },
        ],
    });

    return (
        <>
            <Head title={`${t('withdrawals.title')} — ${group.name}`} />
            {reviewTarget && (
                <ReviewWithdrawalModal
                    group={group}
                    withdrawal={reviewTarget}
                    onClose={() => setReviewTarget(null)}
                />
            )}

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('withdrawals.title')}
                    description={t('withdrawals.subtitle')}
                />

                {/* Summary */}
                <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
                    <SummaryCard
                        label={t('withdrawals.totalRequests')}
                        value={String(summary.total)}
                        icon={LogOut}
                        hint={t('common.all')}
                    />
                    <SummaryCard
                        label={t('withdrawals.pendingReview')}
                        value={String(summary.pending)}
                        icon={Clock}
                        hint={t('withdrawals.makerCheckerWithdrawal')}
                    />
                    <SummaryCard
                        label={t('common.approved')}
                        value={String(summary.approved)}
                        icon={CheckCircle}
                        hint={t('common.approved')}
                    />
                    <SummaryCard
                        label={t('common.rejected')}
                        value={String(summary.rejected)}
                        icon={XCircle}
                        hint={t('common.rejected')}
                    />
                </div>

                {/* Withdrawals Table */}
                <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-base font-semibold">
                            {t('withdrawals.requestsList')}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {t('withdrawals.makerCheckerWithdrawal')}
                        </p>
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
                                        {t('withdrawals.settlementType')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('withdrawals.settlementAmount')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('common.status')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('common.date')}
                                    </th>
                                    <th className="px-6 py-3">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {withdrawals.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center text-muted-foreground"
                                        >
                                            {t('withdrawals.noRequests')}
                                        </td>
                                    </tr>
                                ) : (
                                    withdrawals.map((w) => {
                                        const sc = statusConfig[w.status];
                                        return (
                                            <tr
                                                key={w.id}
                                                className="hover:bg-muted/20"
                                            >
                                                <td className="px-6 py-3 font-medium">
                                                    {w.member_profile
                                                        ?.full_name ?? '—'}
                                                </td>
                                                <td className="max-w-xs px-6 py-3 text-muted-foreground">
                                                    {w.reason}
                                                </td>
                                                <td className="px-6 py-3 capitalize">
                                                    {w.settlement_type?.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 tabular-nums">
                                                    {w.settlement_amount
                                                        ? `ETB ${parseFloat(w.settlement_amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`
                                                        : '—'}
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
                                                        w.created_at,
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {w.status ===
                                                        'requested' && (
                                                        <button
                                                            onClick={() =>
                                                                setReviewTarget(
                                                                    w,
                                                                )
                                                            }
                                                            className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                                                        >
                                                            {t('common.review')}
                                                        </button>
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
            </PageContainer>
        </>
    );
}
